// Tests deterministas de los módulos puros del shell (Sprint 1).
// Sin dependencias: usa node:assert. Uso: node scripts/test.mjs
import assert from 'node:assert/strict';
import { ESTATUS, TRANSICIONES, puedeTransicionar, esTerminal, validarArticulo, crearArticulo } from '../Codigo/js/negocio.js';
import { calcularDimensiones } from '../Codigo/js/utils/imagen.js';
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

console.log('\nnegocio.js — validarArticulo / crearArticulo');
t('validarArticulo acepta un artículo válido', () => {
  const r = validarArticulo({ nombre: 'Llavero', precioSugerido: 50 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errores, {});
});

t('validarArticulo exige nombre', () => {
  const r = validarArticulo({ precioSugerido: 50 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.nombre);
});

t('validarArticulo rechaza nombre solo con espacios', () => {
  const r = validarArticulo({ nombre: '   ', precioSugerido: 50 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.nombre);
});

t('validarArticulo exige precioSugerido', () => {
  const r = validarArticulo({ nombre: 'Taza' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.precioSugerido);
});

t('validarArticulo rechaza precio no mayor a 0', () => {
  for (const p of [0, -5, 'abc', null, '']) {
    const r = validarArticulo({ nombre: 'Taza', precioSugerido: p });
    assert.equal(r.ok, false, `precio ${p} debería fallar`);
    assert.ok(r.errores.precioSugerido);
  }
});

t('validarArticulo acepta precio como string numérico', () => {
  const r = validarArticulo({ nombre: 'Taza', precioSugerido: '12.5' });
  assert.equal(r.ok, true);
});

t('crearArticulo aplica defaults e inyecta id/ahora', () => {
  const a = crearArticulo({ nombre: 'Taza', precioSugerido: 80 }, { id: 'id-1', ahora: 123 });
  assert.equal(a.id, 'id-1');
  assert.equal(a.fechaRegistro, 123);
  assert.equal(a.estatus, ESTATUS.ALMACENADO);
  assert.equal(a.nombre, 'Taza');
  assert.equal(a.precioSugerido, 80);
  assert.equal(a.descripcion, '');
  assert.equal(a.detalles, '');
  assert.equal('foto' in a, false);
});

t('crearArticulo conserva foto cuando se provee', () => {
  const a = crearArticulo({ nombre: 'Taza', precioSugerido: 80, foto: 'blob' }, { id: 'id-2', ahora: 200 });
  assert.equal(a.foto, 'blob');
});

t('crearArticulo genera id y fecha por defecto', () => {
  const a = crearArticulo({ nombre: 'Taza', precioSugerido: 80 });
  assert.equal(typeof a.id, 'string');
  assert.ok(a.id.length > 0);
  assert.equal(typeof a.fechaRegistro, 'number');
  assert.ok(a.fechaRegistro > 0);
});

console.log('\nimagen.js — calcularDimensiones');
t('calcularDimensiones no escala si cabe en maxLado', () => {
  assert.deepEqual(calcularDimensiones(400, 300, 800), { ancho: 400, alto: 300 });
});

t('calcularDimensiones escala horizontal manteniendo el ratio', () => {
  assert.deepEqual(calcularDimensiones(1600, 800, 800), { ancho: 800, alto: 400 });
});

t('calcularDimensiones escala vertical manteniendo el ratio', () => {
  assert.deepEqual(calcularDimensiones(800, 1600, 800), { ancho: 400, alto: 800 });
});

t('calcularDimensiones redondea sin exceder maxLado', () => {
  const r = calcularDimensiones(1000, 333, 800);
  assert.equal(r.ancho, 800);
  assert.equal(r.alto, 266);
  assert.ok(r.ancho <= 800 && r.alto <= 800);
});

t('calcularDimensiones devuelve cero para entrada inválida', () => {
  assert.deepEqual(calcularDimensiones(0, 0, 800), { ancho: 0, alto: 0 });
  assert.deepEqual(calcularDimensiones(-10, 100, 800), { ancho: 0, alto: 0 });
});

console.log(`\n${passed} ok, ${failed} fallaron`);
if (failed > 0) process.exit(1);
