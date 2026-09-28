import { describe, expect, it } from 'vitest';
import { formatArs, formatCierre, formatDia, formatPct, relativeTime } from '../../src/lib/format';

describe('format', () => {
  it('pesos en es-AR', () => {
    expect(formatArs(1565)).toBe('$ 1.565');
    expect(formatArs(1550.6)).toBe('$ 1.550,6');
    expect(formatArs(1557.3)).toBe('$ 1.557,3');
  });
  it('porcentaje con signo tipográfico y un decimal', () => {
    expect(formatPct(0.3)).toBe('+0,3 %');
    expect(formatPct(-0.4)).toBe('−0,4 %');
    expect(formatPct(0)).toBe('0,0 %');
    expect(formatPct(30)).toBe('+30,0 %');
  });
  it('cierre en hora Argentina', () => {
    expect(formatCierre('2026-09-25T21:00:00.000Z')).toBe('vie 25/09 18:00');
  });
  it('día del dato sin hora', () => {
    expect(formatDia('2026-09-25T00:00:00-03:00')).toBe('25/09');
  });
  it('tiempo relativo', () => {
    const now = new Date('2026-09-28T13:00:00.000Z');
    expect(relativeTime('2026-09-28T12:56:00.000Z', now)).toBe('hace 4 min');
    expect(relativeTime('2026-09-28T10:00:00.000Z', now)).toBe('hace 3 h');
    expect(relativeTime('2026-09-26T13:00:00.000Z', now)).toBe('hace 2 días');
    expect(relativeTime('2026-09-28T12:59:50.000Z', now)).toBe('recién');
  });
});
