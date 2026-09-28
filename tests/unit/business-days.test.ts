import { describe, expect, it } from 'vitest';
import { addDays, isBusinessDay, isWeekend, previousBusinessDay } from '../../src/lib/business-days';
import feriados from '../../src/lib/fixtures/feriados.json';

const HOLIDAYS = feriados.map((f) => f.fecha);

describe('isWeekend', () => {
  it('sábado y domingo', () => {
    expect(isWeekend('2026-09-26')).toBe(true); // sábado
    expect(isWeekend('2026-09-27')).toBe(true); // domingo
  });
  it('lunes a viernes', () => {
    expect(isWeekend('2026-09-28')).toBe(false); // lunes
    expect(isWeekend('2026-09-25')).toBe(false); // viernes
  });
});

describe('isBusinessDay', () => {
  it('feriado nacional no es hábil', () => {
    expect(HOLIDAYS).toContain('2026-10-12');
    expect(isBusinessDay('2026-10-12', HOLIDAYS)).toBe(false);
  });
  it('día común es hábil', () => {
    expect(isBusinessDay('2026-09-29', HOLIDAYS)).toBe(true);
  });
  it('sin lista de feriados, solo cuenta el fin de semana', () => {
    expect(isBusinessDay('2026-10-12', [])).toBe(true);
  });
});

describe('previousBusinessDay', () => {
  it('martes → lunes', () => {
    expect(previousBusinessDay('2026-09-29', HOLIDAYS)).toBe('2026-09-28');
  });
  it('lunes → viernes (salta el fin de semana)', () => {
    expect(previousBusinessDay('2026-09-28', HOLIDAYS)).toBe('2026-09-25');
  });
  it('domingo → viernes', () => {
    expect(previousBusinessDay('2026-09-27', HOLIDAYS)).toBe('2026-09-25');
  });
  it('martes después de feriado en lunes → viernes anterior', () => {
    // 12/10/2026 es lunes y feriado
    expect(previousBusinessDay('2026-10-13', HOLIDAYS)).toBe('2026-10-09');
  });
  it('feriado doble (24 y 25/12, 25 feriado) → 24 es hábil', () => {
    expect(previousBusinessDay('2026-12-28', HOLIDAYS)).toBe('2026-12-24');
  });
});

describe('addDays', () => {
  it('cruza fin de mes y año', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
