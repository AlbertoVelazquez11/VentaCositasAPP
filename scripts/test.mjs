// Tests deterministas de los módulos puros del shell (Sprint 1).
// Sin dependencias: usa node:assert. Uso: node scripts/test.mjs
import assert from 'node:assert/strict';
import {
  ESTATUS,
  TRANSICIONES,
  puedeTransicionar,
  esTerminal,
  validarArticulo,
  crearArticulo,
  filtrarArticulos,
  ordenarArticulos,
  buscarArticulos,
  descartarArticulo,
  venderArticulo,
} from '../Codigo/js/negocio.js';
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

console.log('\nnegocio.js — Sprint 3: filtrar / ordenar / buscar / descartar / vender');

const fixtureArticulos = [
  { id: 'a1', nombre: 'Llavero tejido', descripcion: 'Hecho a mano', detalles: 'Algodón', precioSugerido: 50, estatus: ESTATUS.ALMACENADO, fechaRegistro: 300 },
  { id: 'a2', nombre: 'Taza de barro', descripcion: 'Pintada a mano', detalles: 'Cerámica', precioSugerido: 80, estatus: ESTATUS.EN_VENTA, fechaRegistro: 100 },
  { id: 'a3', nombre: 'Pulsera', descripcion: 'Cuero', detalles: 'Ajustable', precioSugerido: 30, estatus: ESTATUS.VENDIDO, fechaRegistro: 200 },
  { id: 'a4', nombre: 'Gorra', descripcion: 'Bordada', detalles: 'Algodón', precioSugerido: 120, estatus: ESTATUS.DESCARTADO, fechaRegistro: 400 },
];

t('filtrarArticulos con null devuelve todos', () => {
  assert.deepEqual(filtrarArticulos(fixtureArticulos, null), fixtureArticulos);
});

t("filtrarArticulos con 'todos' devuelve todos", () => {
  assert.equal(filtrarArticulos(fixtureArticulos, 'todos').length, 4);
});

t('filtrarArticulos filtra por estatus', () => {
  assert.deepEqual(filtrarArticulos(fixtureArticulos, ESTATUS.VENDIDO).map((a) => a.id), ['a3']);
});

t('filtrarArticulos con estatus inexistente devuelve []', () => {
  assert.deepEqual(filtrarArticulos(fixtureArticulos, 'desconocido'), []);
});

t('ordenarArticulos por precioSugerido asc', () => {
  const r = ordenarArticulos(fixtureArticulos, { campo: 'precioSugerido', direccion: 'asc' });
  assert.deepEqual(r.map((a) => a.precioSugerido), [30, 50, 80, 120]);
});

t('ordenarArticulos por precioSugerido desc', () => {
  const r = ordenarArticulos(fixtureArticulos, { campo: 'precioSugerido', direccion: 'desc' });
  assert.deepEqual(r.map((a) => a.precioSugerido), [120, 80, 50, 30]);
});

t('ordenarArticulos por fechaRegistro desc', () => {
  const r = ordenarArticulos(fixtureArticulos, { campo: 'fechaRegistro', direccion: 'desc' });
  assert.deepEqual(r.map((a) => a.id), ['a4', 'a1', 'a3', 'a2']);
});

t('ordenarArticulos no muta el original', () => {
  const antes = fixtureArticulos.map((a) => a.id).join(',');
  ordenarArticulos(fixtureArticulos, { campo: 'precioSugerido', direccion: 'desc' });
  assert.equal(fixtureArticulos.map((a) => a.id).join(','), antes);
});

t('buscarArticulos con texto vacío devuelve todos', () => {
  assert.equal(buscarArticulos(fixtureArticulos, '').length, 4);
  assert.equal(buscarArticulos(fixtureArticulos, '   ').length, 4);
});

t('buscarArticulos busca en nombre case-insensitive', () => {
  assert.deepEqual(buscarArticulos(fixtureArticulos, 'TAZA').map((a) => a.id), ['a2']);
});

t('buscarArticulos busca en descripcion y detalles', () => {
  assert.deepEqual(buscarArticulos(fixtureArticulos, 'algodón').map((a) => a.id).sort(), ['a1', 'a4']);
  assert.deepEqual(buscarArticulos(fixtureArticulos, 'cuero').map((a) => a.id), ['a3']);
});

t('buscarArticulos sin coincidencias devuelve []', () => {
  assert.deepEqual(buscarArticulos(fixtureArticulos, 'xyz'), []);
});

t('buscarArticulos aplica trim al texto', () => {
  assert.deepEqual(buscarArticulos(fixtureArticulos, '  taza  ').map((a) => a.id), ['a2']);
});

t('descartarArticulo devuelve nuevo objeto sin mutar el original', () => {
  const a = { id: 'x', nombre: 'Taza', estatus: ESTATUS.ALMACENADO, precioSugerido: 50 };
  const r = descartarArticulo(a, 'Se rompió', { ahora: 123 });
  assert.equal(r.estatus, ESTATUS.DESCARTADO);
  assert.equal(r.motivoDescarte, 'Se rompió');
  assert.equal(r.fechaDescarte, 123);
  assert.equal(a.estatus, ESTATUS.ALMACENADO);
  assert.equal('motivoDescarte' in a, false);
  assert.notEqual(r, a);
});

t('descartarArticulo con motivo vacío lanza Error', () => {
  assert.throws(() => descartarArticulo({ estatus: ESTATUS.ALMACENADO }, ''), /motivo/i);
  assert.throws(() => descartarArticulo({ estatus: ESTATUS.ALMACENADO }, '   '), /motivo/i);
});

t('descartarArticulo con estado terminal lanza Error', () => {
  assert.throws(() => descartarArticulo({ estatus: ESTATUS.VENDIDO }, 'Razón'), /descartar/i);
  assert.throws(() => descartarArticulo({ estatus: ESTATUS.DESCARTADO }, 'Razón'), /descartar/i);
});

t('venderArticulo vende artículo activo y arma la venta', () => {
  const a = { id: 'a1', nombre: 'Taza', precioSugerido: 80, estatus: ESTATUS.ALMACENADO, descripcion: 'x' };
  const { articulo, venta } = venderArticulo(
    a,
    { lugarVenta: 'Feria', precioVenta: 80, vendidoAlPrecioSugerido: true },
    { id: 'v1', ahora: 500 }
  );
  assert.equal(articulo.estatus, ESTATUS.VENDIDO);
  assert.equal(articulo.fechaVenta, 500);
  assert.equal(articulo.ventaId, 'v1');
  assert.equal(a.estatus, ESTATUS.ALMACENADO, 'no debe mutar el original');
  assert.equal(venta.id, 'v1');
  assert.equal(venta.articuloId, 'a1');
  assert.equal(venta.nombre, 'Taza');
  assert.equal(venta.precioSugerido, 80);
  assert.equal(venta.precioVenta, 80);
  assert.equal(venta.lugarVenta, 'Feria');
  assert.equal(venta.vendidoAlPrecioSugerido, true);
  assert.equal(venta.fechaVenta, 500);
});

t('venderArticulo con precio <= 0 lanza Error', () => {
  assert.throws(() => venderArticulo({ estatus: ESTATUS.EN_VENTA }, { lugarVenta: 'Feria', precioVenta: 0 }), /precio/i);
  assert.throws(() => venderArticulo({ estatus: ESTATUS.EN_VENTA }, { lugarVenta: 'Feria', precioVenta: -5 }), /precio/i);
});

t('venderArticulo con lugarVenta vacío lanza Error', () => {
  assert.throws(() => venderArticulo({ estatus: ESTATUS.EN_VENTA }, { lugarVenta: '', precioVenta: 10 }), /lugar/i);
  assert.throws(() => venderArticulo({ estatus: ESTATUS.EN_VENTA }, { lugarVenta: '   ', precioVenta: 10 }), /lugar/i);
});

t('venderArticulo con estado terminal lanza Error', () => {
  assert.throws(() => venderArticulo({ estatus: ESTATUS.VENDIDO }, { lugarVenta: 'Feria', precioVenta: 10 }), /vender/i);
  assert.throws(() => venderArticulo({ estatus: ESTATUS.DESCARTADO }, { lugarVenta: 'Feria', precioVenta: 10 }), /vender/i);
});

t('venderArticulo genera id y fecha cuando no se inyectan', () => {
  const { articulo, venta } = venderArticulo(
    { id: 'a9', nombre: 'X', estatus: ESTATUS.ALMACENADO },
    { lugarVenta: 'Feria', precioVenta: 10 }
  );
  assert.equal(typeof venta.id, 'string');
  assert.ok(venta.id.length > 0);
  assert.equal(articulo.ventaId, venta.id);
  assert.equal(typeof venta.fechaVenta, 'number');
  assert.ok(venta.fechaVenta > 0);
});

console.log(`\n${passed} ok, ${failed} fallaron`);
if (failed > 0) process.exit(1);
