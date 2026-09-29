import { describe, expect, it } from 'vitest';
import { linearScale, monotonePath, nearestIndex, niceTicks, padDomain } from '../../src/lib/chart';

describe('chart utils', () => {
  it('linearScale mapea y centra un dominio degenerado', () => {
    const s = linearScale(0, 10, 0, 100);
    expect(s(5)).toBe(50);
    expect(linearScale(3, 3, 0, 100)(3)).toBe(50);
  });
  it('niceTicks da valores redondos que cubren el rango', () => {
    expect(niceTicks(1502, 1578, 3)).toEqual([1520, 1540, 1560]);
    expect(niceTicks(0.2, 2.9, 3)).toEqual([1, 2]);
    expect(niceTicks(5, 5)).toEqual([5]);
  });
  it('padDomain agrega aire y no explota con un solo valor', () => {
    expect(padDomain([100, 200], 0.1)).toEqual([90, 210]);
    expect(padDomain([7])).toEqual([6 - 0.16, 8 + 0.16]);
  });
  it('monotonePath: 1 y 2 puntos son casos rectos; 3+ produce curvas C', () => {
    expect(monotonePath([[0, 0]])).toBe('M0,0');
    expect(monotonePath([[0, 0], [10, 5]])).toBe('M0,0L10,5');
    expect(monotonePath([[0, 0], [10, 5], [20, 0]])).toMatch(/^M0,0C/);
  });
  it('monotonePath no inventa extremos: serie constante da y constante', () => {
    const d = monotonePath([[0, 50], [10, 50], [20, 50], [30, 50]]);
    const ys = d.match(/,(-?[\d.]+)/g)!.map((s) => Number(s.slice(1)));
    expect(ys.every((y) => y === 50)).toBe(true);
  });
  it('nearestIndex acota a los bordes', () => {
    expect(nearestIndex(-10, 0, 100, 5)).toBe(0);
    expect(nearestIndex(110, 0, 100, 5)).toBe(4);
    expect(nearestIndex(50, 0, 100, 5)).toBe(2);
    expect(nearestIndex(50, 0, 100, 1)).toBe(0);
  });
});
