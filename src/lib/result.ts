import type { ErrorKind, Result } from './types';

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const fail = <T = never>(kind: ErrorKind, message: string): Result<T> => ({
  ok: false,
  error: { kind, message },
});
