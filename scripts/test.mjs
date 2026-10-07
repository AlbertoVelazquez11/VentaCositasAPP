// Tests deterministas de los módulos puros del shell (Sprint 1).
// Sin dependencias: usa node:assert. Uso: node scripts/test.mjs
import assert from 'node:assert/strict';
import { ESTATUS, TRANSICIONES, puedeTransicionar, esTerminal } from '../Codigo/js/negocio.js';
import { Store, store } from '../Codigo/js/store.js';
import { parseHash } from '../Codigo/js/router.js';

let passed = 0;
let failed = 0;

function t(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n    ${e.message}`);
  }
}

console.log('\nnegocio.js');
t('ESTATUS define los 4 valores del dominio', () => {
  assert.deepEqual(
    { ...ESTATUS },
    { ALMACENADO: 'almacenado', EN_VENTA: 'en-venta', VENDIDO: 'vendido', DESCARTADO: 'descartado' }
  );
});

t('todas las transiciones válidas devuelven true', () => {
  const validas = [
    [ESTATUS.ALMACENADO, ESTATUS.EN_VENTA],
    [ESTATUS.EN_VENTA, ESTATUS.ALMACENADO],
    [ESTATUS.ALMACENADO, ESTATUS.VENDIDO],
    [ESTATUS.EN_VENTA, ESTATUS.VENDIDO],
    [ESTATUS.ALMACENADO, ESTATUS.DESCARTADO],
    [ESTATUS.EN_VENTA, ESTATUS.DESCARTADO],
  ];
  for (const [desde, hacia] of validas) {
    assert.equal(puedeTransicionar(desde, hacia), true, `${desde} → ${hacia} debería ser válida`);
  }
});

t('transiciones inválidas devuelven false', () => {
  const invalidas = [
    [ESTATUS.VENDIDO, ESTATUS.ALMACENADO],
    [ESTATUS.VENDIDO, ESTATUS.EN_VENTA],
    [ESTATUS.VENDIDO, ESTATUS.DESCARTADO],
    [ESTATUS.DESCARTADO, ESTATUS.ALMACENADO],
    [ESTATUS.DESCARTADO, ESTATUS.EN_VENTA],
    [ESTATUS.DESCARTADO, ESTATUS.VENDIDO],
    [ESTATUS.ALMACENADO, ESTATUS.ALMACENADO],
    [ESTATUS.EN_VENTA, ESTATUS.EN_VENTA],
    [ESTATUS.ALMACENADO, 'desconocido'],
  ];
  for (const [desde, hacia] of invalidas) {
    assert.equal(puedeTransicionar(desde, hacia), false, `${desde} → ${hacia} debería ser inválida`);
  }
});

t('esTerminal correcto (vendido y descartado son terminales)', () => {
  assert.equal(esTerminal(ESTATUS.VENDIDO), true);
  assert.equal(esTerminal(ESTATUS.DESCARTADO), true);
  assert.equal(esTerminal(ESTATUS.ALMACENADO), false);
  assert.equal(esTerminal(ESTATUS.EN_VENTA), false);
});

t('TRANSICIONES coincide con la spec (6 transiciones, terminales sin salida)', () => {
  assert.deepEqual(
    [...TRANSICIONES[ESTATUS.ALMACENADO]].sort(),
    [ESTATUS.EN_VENTA, ESTATUS.VENDIDO, ESTATUS.DESCARTADO].sort()
  );
  assert.deepEqual(
    [...TRANSICIONES[ESTATUS.EN_VENTA]].sort(),
    [ESTATUS.ALMACENADO, ESTATUS.VENDIDO, ESTATUS.DESCARTADO].sort()
  );
  assert.deepEqual([...TRANSICIONES[ESTATUS.VENDIDO]], []);
  assert.deepEqual([...TRANSICIONES[ESTATUS.DESCARTADO]], []);
});

console.log('\nstore.js');
t('estado inicial con articulos y ventas vacíos', () => {
  const s = new Store({ articulos: [], ventas: [] });
  assert.deepEqual(s.getState(), { articulos: [], ventas: [] });
});

t('singleton store arranca con el estado de la app', () => {
  assert.deepEqual(store.getState(), { articulos: [], ventas: [] });
});

t('setState mezcla parcial y notifica al suscriptor', () => {
  const s = new Store({ articulos: [], ventas: [] });
  const seen = [];
  s.subscribe((state) => seen.push(state));
  const next = s.setState({ articulos: [{ id: 'a1' }] });

  assert.equal(seen.length, 1, 'el suscriptor debe ser notificado una vez');
  assert.equal(seen[0].articulos.length, 1);
  assert.deepEqual(seen[0].ventas, [], 'las ventas no deben verse afectadas por el merge');
  assert.equal(next.articulos.length, 1);
});

t('notify() manual dispara a todos los suscriptores', () => {
  const s = new Store({ n: 0 });
  let count = 0;
  const off1 = s.subscribe(() => count++);
  const off2 = s.subscribe(() => count++);
  s.notify();
  assert.equal(count, 2);
  off1();
  s.notify();
  assert.equal(count, 3);
  off2();
});

t('subscribe devuelve función de baja', () => {
  const s = new Store({});
  let calls = 0;
  const off = s.subscribe(() => calls++);
  s.notify();
  off();
  s.notify();
  assert.equal(calls, 1);
});

console.log('\nrouter.js');
t('parseHash vacío devuelve la ruta raíz', () => {
  assert.deepEqual(parseHash(''), { path: '/', params: {} });
  assert.deepEqual(parseHash('#'), { path: '/', params: {} });
  assert.deepEqual(parseHash(undefined), { path: '/', params: {} });
});

t('parseHash parsea rutas con y sin #', () => {
  assert.deepEqual(parseHash('#/articulos'), { path: '/articulos', params: {} });
  assert.deepEqual(parseHash('/historial'), { path: '/historial', params: {} });
  assert.deepEqual(parseHash('config'), { path: '/config', params: {} });
});

t('parseHash extrae query params', () => {
  assert.deepEqual(parseHash('#/articulos?id=3&modo=gestion'), {
    path: '/articulos',
    params: { id: '3', modo: 'gestion' },
  });
});

t('parseHash normaliza la barra final', () => {
  assert.deepEqual(parseHash('#/articulos/'), { path: '/articulos', params: {} });
});

console.log(`\n${passed} ok, ${failed} fallaron`);
if (failed > 0) process.exit(1);
