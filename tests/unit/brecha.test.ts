import { describe, expect, it } from 'vitest';
import { brechaSeries, calcBrecha } from '../../src/lib/brecha';

describe('calcBrecha', () => {
  it('caso normal con datos reales del 28/09: blue 1560 vs oficial 1545 → 1.0 %', () => {
    expect(calcBrecha(1560, 1545)).toBe(1);
  });
  it('tarjeta 2008.5 vs 1545 → 30.0 %', () => {
    expect(calcBrecha(2008.5, 1545)).toBe(30);
  });
  it('valores iguales → 0', () => {
    expect(calcBrecha(1545, 1545)).toBe(0);
  });
  it('paralelo por debajo del oficial → negativa', () => {
    expect(calcBrecha(1500, 1545)).toBe(-2.9);
  });
});

describe('brechaSeries', () => {
  it('join por fecha, descarta fechas sin contraparte', () => {
    const paralelo = [{ date: '2026-09-25', value: 1560 }, { date: '2026-09-26', value: 1560 }, { date: '2026-09-27', value: 1560 }];
    const oficial = [{ date: '2026-09-25', value: 1540 }, { date: '2026-09-27', value: 1545 }];
    expect(brechaSeries(paralelo, oficial)).toEqual([{ date: '2026-09-25', value: 1.3 }, { date: '2026-09-27', value: 1 }]);
  });
  it('oficial vacío → serie vacía', () => {
    expect(brechaSeries([{ date: '2026-09-25', value: 1560 }], [])).toEqual([]);
  });
});
