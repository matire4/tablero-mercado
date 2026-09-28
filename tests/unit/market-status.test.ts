import { describe, expect, it } from 'vitest';
import { getMarketStatus, toArgentinaTime } from '../../src/lib/market-status';
import feriados from '../../src/lib/fixtures/feriados.json';

const HOLIDAYS = feriados.map((f) => f.fecha);
// Hora Argentina = UTC-3. 12:00 ART = 15:00Z.
const art = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(`${date}T${String(h + 3).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
};

describe('toArgentinaTime', () => {
  it('convierte UTC a hora Argentina, incluso cruzando la medianoche', () => {
    expect(toArgentinaTime(new Date('2026-09-29T01:30:00.000Z'))).toEqual({ date: '2026-09-28', hour: 22.5 });
  });
});

describe('getMarketStatus', () => {
  it('martes 12:00 → abierto; último cierre = lunes 18:00', () => {
    const s = getMarketStatus(art('2026-09-29', '12:00'), HOLIDAYS);
    expect(s.isOpen).toBe(true);
    expect(s.reason).toBe('open');
    expect(s.lastCloseAt).toBe('2026-09-28T21:00:00.000Z');
  });
  it('viernes 19:30 → cerrado por horario; último cierre = ese viernes 18:00', () => {
    const s = getMarketStatus(art('2026-09-25', '19:30'), HOLIDAYS);
    expect(s).toMatchObject({ isOpen: false, reason: 'outside-hours', lastCloseAt: '2026-09-25T21:00:00.000Z' });
  });
  it('sábado → weekend; último cierre = viernes 18:00', () => {
    const s = getMarketStatus(art('2026-09-26', '11:00'), HOLIDAYS);
    expect(s).toMatchObject({ isOpen: false, reason: 'weekend', lastCloseAt: '2026-09-25T21:00:00.000Z' });
  });
  it('lunes 08:00 → cerrado por horario; último cierre = viernes 18:00', () => {
    const s = getMarketStatus(art('2026-09-28', '08:00'), HOLIDAYS);
    expect(s).toMatchObject({ isOpen: false, reason: 'outside-hours', lastCloseAt: '2026-09-25T21:00:00.000Z' });
  });
  it('feriado en lunes (12/10) → holiday; último cierre = viernes 09/10', () => {
    const s = getMarketStatus(art('2026-10-12', '12:00'), HOLIDAYS);
    expect(s).toMatchObject({ isOpen: false, reason: 'holiday', lastCloseAt: '2026-10-09T21:00:00.000Z' });
  });
  it('mismo feriado sin lista de feriados → abierto (degradación sin feriados)', () => {
    const s = getMarketStatus(art('2026-10-12', '12:00'), [], 'fallback-fixture');
    expect(s.isOpen).toBe(true);
    expect(s.holidaysSource).toBe('fallback-fixture');
  });
  it('bordes: 10:00 abre, 18:00 cierra', () => {
    expect(getMarketStatus(art('2026-09-29', '09:59'), HOLIDAYS).isOpen).toBe(false);
    expect(getMarketStatus(art('2026-09-29', '10:00'), HOLIDAYS).isOpen).toBe(true);
    expect(getMarketStatus(art('2026-09-29', '17:59'), HOLIDAYS).isOpen).toBe(true);
    expect(getMarketStatus(art('2026-09-29', '18:00'), HOLIDAYS).isOpen).toBe(false);
  });
  it('el fixture viernes-cerrado se evalúa con su propio now', () => {
    const s = getMarketStatus(new Date('2026-09-25T22:30:00.000Z'), HOLIDAYS);
    expect(s.isOpen).toBe(false);
    expect(s.reason).toBe('outside-hours');
  });
});
