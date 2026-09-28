import { describe, expect, it } from 'vitest';
import { calcChangePct } from '../../src/lib/change';
import oficial from '../../src/lib/fixtures/history-oficial.json';
import riesgo from '../../src/lib/fixtures/history-riesgo-pais.json';

const p = (date: string, value: number) => ({ date, value });

describe('calcChangePct', () => {
  it('día normal: martes contra lunes', () => {
    const hist = [p('2026-09-28', 1000), p('2026-09-29', 1010)];
    expect(calcChangePct(p('2026-09-29', 1010), hist)).toBe(1);
  });

  it('lunes: compara contra el domingo, que ya trae el cierre del viernes', () => {
    // Patrón real de oficial/MEP: el sábado cambia respecto del viernes; domingo y lunes repiten el sábado.
    const hist = [p('2026-09-25', 1540), p('2026-09-26', 1545), p('2026-09-27', 1545), p('2026-09-28', 1545)];
    expect(calcChangePct(p('2026-09-28', 1545), hist)).toBe(0);
  });

  it('con datos reales del fixture: oficial lunes 28/09 → 0 %', () => {
    const hist = oficial.map((x) => p(x.fecha, x.venta));
    const current = hist[hist.length - 1];
    expect(current.date).toBe('2026-09-28');
    expect(calcChangePct(current, hist)).toBe(0);
  });

  it('día después de feriado: compara contra la entrada del feriado (última anterior)', () => {
    const hist = [p('2026-10-09', 1000), p('2026-10-12', 1020), p('2026-10-13', 1030)];
    expect(calcChangePct(p('2026-10-13', 1030), hist)).toBeCloseTo(1, 5);
  });

  it('serie de solo días hábiles (riesgo país): contra la rueda anterior', () => {
    const hist = riesgo.map((x) => p(x.fecha, x.valor));
    const current = hist[hist.length - 1]; // 2026-09-25, 609; anterior 2026-09-24, 578
    expect(current).toEqual(p('2026-09-25', 609));
    expect(calcChangePct(current, hist)).toBe(5.4);
  });

  it('sin movimiento → 0, no null', () => {
    expect(calcChangePct(p('2026-09-29', 500), [p('2026-09-28', 500)])).toBe(0);
  });

  it('sin entrada anterior → null', () => {
    expect(calcChangePct(p('2026-09-28', 500), [p('2026-09-28', 500)])).toBeNull();
    expect(calcChangePct(p('2026-09-28', 500), [])).toBeNull();
  });

  it('valor anterior 0 → null (no dividir por cero)', () => {
    expect(calcChangePct(p('2026-09-29', 5), [p('2026-09-28', 0)])).toBeNull();
  });

  it('no depende del orden del histórico', () => {
    const hist = [p('2026-09-29', 1010), p('2026-09-26', 990), p('2026-09-28', 1000)];
    expect(calcChangePct(p('2026-09-29', 1010), hist)).toBe(1);
  });

  it('redondea a un decimal', () => {
    expect(calcChangePct(p('2026-09-29', 1001), [p('2026-09-28', 3000)])).toBe(-66.6);
  });
});
