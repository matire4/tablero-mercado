// Único lugar del proyecto que hace `fetch` a un proveedor externo.
// Convierte cualquier falla en un Result tipado; nunca lanza.
//
// Mapeo de errores (docs/arquitectura.md §7):
//   timeout / abort                → 'timeout'
//   HTTP 429                       → 'rate-limited'
//   otro HTTP >= 400 o falla de red → 'upstream'
//   body vacío o array vacío       → 'empty'
//   JSON que no parsea             → 'invalid'
//
// La cache es la Data Cache de Next: `next: { revalidate }` por request. Fuera de Next (tests) la opción se ignora.

import { fail, ok } from './result';
import type { Result } from './types';

export const DEFAULT_TIMEOUT_MS = 5000;

export interface FetchJsonOptions {
  /** Segundos de revalidación en la Data Cache de Next. */
  revalidate: number;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<Result<T>> {
  const { revalidate, headers, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate },
    } as RequestInit);
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      return fail('timeout', `Sin respuesta en ${timeoutMs} ms`);
    }
    return fail('upstream', `Falla de red: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (response.status === 429) return fail('rate-limited', 'HTTP 429: límite de uso alcanzado');
  if (!response.ok) return fail('upstream', `HTTP ${response.status}`);

  const text = await response.text();
  if (text.trim() === '') return fail('empty', 'Respuesta vacía');

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail('invalid', 'La respuesta no es JSON');
  }
  if (Array.isArray(json) && json.length === 0) return fail('empty', 'Lista vacía');

  return ok(json as T);
}
