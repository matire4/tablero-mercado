// Genera src/lib/fixtures/*.json a partir de las respuestas reales guardadas en src/lib/fixtures/raw/.
// Los fixtures conservan la FORMA de cada proveedor, así el modo mock pasa por los mismos adaptadores que el modo real.
// Uso: node scripts/build-fixtures.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const RAW = 'src/lib/fixtures/raw';
const OUT = 'src/lib/fixtures';
const DIAS_HISTORICO = 90; // igual al rango máximo del selector (7/30/90): el mock nunca muestra menos días que los que promete

const read = (f) => JSON.parse(readFileSync(`${RAW}/${f}`, 'utf8'));
const write = (f, data) => writeFileSync(`${OUT}/${f}`, JSON.stringify(data, null, 2) + '\n');

// Últimos N días calendario de una serie ordenada por fecha ascendente.
const ultimosDias = (serie, dias, hasta) => {
  const desde = new Date(hasta);
  desde.setUTCDate(desde.getUTCDate() - dias);
  const d = desde.toISOString().slice(0, 10);
  return serie.filter((p) => p.fecha >= d && p.fecha <= hasta);
};

const HASTA = '2026-09-28'; // fecha en que se bajaron los crudos

// Históricos (ArgentinaDatos): un archivo por activo, mismo formato del proveedor.
for (const casa of ['oficial', 'blue', 'bolsa', 'tarjeta']) {
  write(`history-${casa}.json`, ultimosDias(read(`argdatos-${casa}-historico.json`), DIAS_HISTORICO, HASTA));
}
write('history-riesgo-pais.json', ultimosDias(read('argdatos-riesgo-historico.json'), DIAS_HISTORICO, HASTA));

// Feriados: tal cual.
write('feriados.json', read('argdatos-feriados.json'));

// Noticias: una respuesta real por idioma, tal cual, con su propio reloj congelado = cuándo se bajó la última
// (29/09 09:32Z). Así "hace X h" es cierto respecto de la captura y ninguna nota queda en el futuro.
// La búsqueda en español se bajó el 28/09; la de inglés es la v2 (búsqueda internacional, 29/09).
write('news.json', { now: '2026-09-29T09:32:00.000Z', es: read('gnews-search.json'), en: read('gnews-search-en-v2.json') });

// Escenarios de cotizaciones. Cada uno lleva su propio `now` congelado:
// el estado de mercado y "actualizado hace X" se calculan con ese reloj, no con el real.
const dolares = read('dolarapi-dolares.json');
const riesgoUltimo = read('argdatos-riesgo-ultimo.json');

// normal: lunes 28/09 a las 10:00 ART (13:00Z), mercado abierto, respuestas reales tal cual.
write('quotes-normal.json', { now: '2026-09-28T13:00:00.000Z', dolarapi: dolares, riesgoUltimo });

// sin-oficial: mismo día, DolarAPI no devuelve la casa "oficial". Brecha debe quedar "no disponible".
write('quotes-sin-oficial.json', {
  now: '2026-09-28T13:00:00.000Z',
  dolarapi: dolares.filter((d) => d.casa !== 'oficial'),
  riesgoUltimo,
});

// viernes-cerrado: viernes 25/09 a las 19:30 ART (22:30Z), mercado cerrado.
// No hay crudo de DolarAPI de ese día: se reconstruye con los valores del histórico del 25/09
// y una hora de actualización de ese viernes. Está marcado como derivado.
const hist = Object.fromEntries(['oficial', 'blue', 'bolsa', 'tarjeta'].map((c) => [c, read(`argdatos-${c}-historico.json`).find((p) => p.fecha === '2026-09-25')]));
write('quotes-viernes-cerrado.json', {
  now: '2026-09-25T22:30:00.000Z',
  derivadoDe: 'argdatos-*-historico.json (fecha 2026-09-25); no es una respuesta real de DolarAPI',
  dolarapi: dolares.map((d) => hist[d.casa]
    ? { ...d, compra: hist[d.casa].compra, venta: hist[d.casa].venta, fechaActualizacion: '2026-09-25T20:00:00.000Z' }
    : { ...d, fechaActualizacion: '2026-09-25T20:00:00.000Z' }),
  riesgoUltimo: { valor: 609, fecha: '2026-09-25' },
});

console.log('fixtures generados en', OUT);
