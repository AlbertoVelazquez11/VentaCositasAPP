# VentaCositas

PWA offline-first para registrar el inventario de artículos que se pretenden vender.

- Vanilla JS ES6 (sin framework ni bundler)
- Hash Router + Store reactivo (Observer) + IndexedDB
- Service Worker cache-first
- Deploy en Vercel (`outputDirectory: "Codigo"`)

## Estado

- Estatus: `almacenado` → `en-venta` → `vendido` | `descartado`
- Historial de ventas con precio real.
- Sin respaldo/export; compresión de fotos antes de guardarlas.

Ver `Concepto_PWA_VentaCositas.md` para el alcance congelado (D1–D9).
