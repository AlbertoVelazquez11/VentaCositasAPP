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
2. **Modo Cositas** — alta, edición, swipe-descarte (confirmación+motivo), compresión de fotos
3. **Modo Gestión + Detalle** — filtros, orden, búsqueda, vender (genera `ventas`), descartar
4. **Historial + Config + QA**

## Sprint 1 — Tareas

- [x] S1.1 Scaffolding: `.gitignore`, `README.md`, `vercel.json`, `Codigo/package.json` (type module), estructura `Codigo/`
- [x] S1.2 Shell SPA: `index.html` + hash router + bootstrap `app.js`
- [x] S1.3 Store reactivo (Observer) + `negocio.js` (ESTATUS + transiciones)
- [x] S1.4 `db.js`: IndexedDB `VentaCositas` v1 (`articulos` + `ventas`), CRUD genérico
- [x] S1.5 Service Worker cache-first + `manifest.json` + icono
- [x] S1.6 Vista Inicio (Gestionar / Historial / Config) + navegación
- [x] S1.7 Tests deterministas (`negocio`, `store`, `router`) + verificación

## Evidencia de commits

| Commit | Tarea | Notas |
| --- | --- | --- |
| `1bac172` | chore | init proyecto: concepto, tracking ODD, scaffolding |
| `06178f3` | S1.1–S1.7 | shell PWA completo (14/14 tests verdes, verificado por gentle-ai-verify) |
