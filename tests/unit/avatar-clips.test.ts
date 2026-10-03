import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Los clips del avatar se repiten mientras su paso está abierto, con una pausa en la pose de frente (decisión del
 * 02/10). El bucle y la pausa viven en el archivo WebP, no en el código: si alguien regenera un clip con las opciones
 * por defecto (una sola reproducción), el avatar vuelve a quedar quieto y este test lo marca.
 * Formato: contenedor RIFF/WebP extendido; chunk ANIM (bytes 4-5: cantidad de repeticiones, 0 = sin fin) y un ANMF
 * por cuadro (bytes 12-14: duración en ms).
 */
function readClip(name: string) {
  const b = readFileSync(`public/avatar/mati-${name}.webp`);
  expect(b.toString('latin1', 0, 4)).toBe('RIFF');
  expect(b.toString('latin1', 8, 12)).toBe('WEBP');
  let loops: number | null = null;
  const durations: number[] = [];
  for (let i = 12; i < b.length; ) {
    const id = b.toString('latin1', i, i + 4);
    const size = b.readUInt32LE(i + 4);
    if (id === 'ANIM') loops = b.readUInt16LE(i + 8 + 4);
    if (id === 'ANMF') durations.push(b.readUIntLE(i + 8 + 12, 3));
    i += 8 + size + (size & 1);
  }
  return { loops, durations };
}

describe('clips del avatar', () => {
  for (const name of ['saludo', 'paso', 'cierre']) {
    it(`${name}: se repite sin fin, con 1,5 s de pausa en la pose de frente`, () => {
      const { loops, durations } = readClip(name);
      expect(loops).toBe(0);
      expect(durations.length).toBeGreaterThan(10);
      expect(durations.at(-1)).toBe(67 + 1500);
      expect(durations.slice(0, -1).every((d) => d === 67)).toBe(true); // 15 cuadros por segundo, sin tocar
    });
  }
});
