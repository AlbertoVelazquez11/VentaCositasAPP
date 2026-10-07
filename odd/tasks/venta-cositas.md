# Feature: VentaCositas PWA

Repositorio: `VentaCositasAPP` (AlbertoVelazquez11) — rama `main`
Concepto: `Concepto_PWA_VentaCositas.md` (alcance congelado D1–D9)

## Alcance congelado

- PWA offline-first para inventario de artículos a vender.
- 2 object stores: `articulos`, `ventas`.
- 5 pantallas: Inicio, Artículos (2 modos), Detalle, Historial, Config.
- Estados: `almacenado` → `en-venta` (manual) → `vendido` | `descartado` (terminales, sin reversibilidad).
- Sin respaldo/export. Compresión de fotos. Búsqueda por texto.

## Plan de sprints

1. **Shell PWA** — hash router, store, IndexedDB, SW, manifest, Inicio — **COMPLETO**
2. **Modo Cositas** — alta, edición, swipe-descarte (confirmación+motivo), compresión de fotos — **COMPLETO**
3. **Modo Gestión + Detalle** — filtros, orden, búsqueda, vender (genera `ventas`), descartar — **COMPLETO**
4. **Historial + Config + QA**

## Sprint 1 — Tareas

- [x] S1.1 Scaffolding: `.gitignore`, `README.md`, `vercel.json`, `Codigo/package.json` (type module), estructura `Codigo/`
- [x] S1.2 Shell SPA: `index.html` + hash router + bootstrap `app.js`
- [x] S1.3 Store reactivo (Observer) + `negocio.js` (ESTATUS + transiciones)
- [x] S1.4 `db.js`: IndexedDB `VentaCositas` v1 (`articulos` + `ventas`), CRUD genérico
- [x] S1.5 Service Worker cache-first + `manifest.json` + icono
- [x] S1.6 Vista Inicio (Gestionar / Historial / Config) + navegación
- [x] S1.7 Tests deterministas (`negocio`, `store`, `router`) + verificación

## Sprint 2 — Tareas

- [x] S2.1 Vista Artículos: reemplazar placeholder `#/articulos` por vista con toggle de modo (Cositas / Gestión)
- [x] S2.2 Modo Cositas: listado simple de artículos (db → store → render)
- [x] S2.3 Alta de artículo: formulario + compresión de foto + guardado (estatus inicial `almacenado`)
- [x] S2.4 Edición de artículo: seleccionar → editar campos → guardar
- [x] S2.5 Swipe-descarte: swipe izquierda + confirmación + motivo → `descartado`
- [x] S2.6 Componentes: `modal` (motivo), `toast`, `swipe-item`, util de compresión de imagen
- [x] S2.7 Lógica pura + tests: `validarArticulo`, `crearArticulo`, `calcularDimensiones` (test-first)

## Sprint 3 — Tareas

- [x] S3.1 Modo Gestión: filtro por estatus + orden por precio + búsqueda por texto (reemplaza placeholder)
- [x] S3.2 Detalle (modal): info completa del artículo + acciones según estado
- [x] S3.3 Marcar como vendido: formulario (lugar, precio real/sugerido) → crea `venta` + actualiza artículo
- [x] S3.4 Marcar como descartado desde Detalle (motivo obligatorio)
- [x] S3.5 Lógica pura: `filtrarArticulos`, `ordenarArticulos`, `buscarArticulos`
- [x] S3.6 Lógica pura: `venderArticulo`, `descartarArticulo`
- [x] S3.7 Tests (extender test.mjs) + verificación

## Evidencia de commits

| Commit | Tarea | Notas |
| --- | --- | --- |
| `1bac172` | chore | init proyecto: concepto, tracking ODD, scaffolding |
| `06178f3` | S1.1–S1.7 | shell PWA completo (14/14 tests verdes, verificado por gentle-ai-verify) |
| `26d7725` | S2.1–S2.7 | modo Cositas completo (28/28 tests verdes, verificado) |
| `788c2ec` | S3.1–S3.7 | modo Gestión + Detalle completo (49/49 tests verdes, verificado) |
