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

1. **Shell PWA** — hash router, store, IndexedDB, SW, manifest, Inicio — EN CURSO
2. **Modo Cositas** — alta, edición, swipe-descarte (confirmación+motivo), compresión de fotos
3. **Modo Gestión + Detalle** — filtros, orden, búsqueda, vender (genera `ventas`), descartar
4. **Historial + Config + QA**

## Sprint 1 — Tareas

- [ ] S1.1 Scaffolding: `.gitignore`, `README.md`, `vercel.json`, `Codigo/package.json` (type module), estructura `Codigo/`
- [ ] S1.2 Shell SPA: `index.html` + hash router + bootstrap `app.js`
- [ ] S1.3 Store reactivo (Observer) + `negocio.js` (ESTATUS + transiciones)
- [ ] S1.4 `db.js`: IndexedDB `VentaCositas` v1 (`articulos` + `ventas`), CRUD genérico
- [ ] S1.5 Service Worker cache-first + `manifest.json` + icono
- [ ] S1.6 Vista Inicio (Gestionar / Historial / Config) + navegación
- [ ] S1.7 Tests deterministas (`negocio`, `store`, `router`) + verificación

## Evidencia de commits

| Commit | Tarea | Notas |
| --- | --- | --- |
| (pendiente) | | |
