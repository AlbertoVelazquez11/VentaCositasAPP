# Concepto — PWA VentaCositas

> Documento de definición. Alcance **congelado** con las decisiones del usuario (D1–D9). Generado a partir del borrador de requerimientos y de la estructura de los PWA anteriores (TamalitosAPP y MercaditoShop).

---

## 1. Premisa

PWA offline-first para el **registro de inventario de artículos que se pretenden vender**. Más sencilla que los proyectos anteriores: no maneja compras, lotes, producción ni PDV. Lleva un catálogo vivo de "cositas" con su ciclo de vida y genera un historial de ventas cuando un artículo se vende.

---

## 2. Alcance

**Incluye**
- Registrar artículos con: nombre, precio sugerido, fotografía (opcional, **comprimida antes de guardar**), descripción, campo de detalles, fecha de registro (oculta) y estatus.
- Estatus: `Almacenado`, `En venta`, `Vendido`, `Descartado`.
- Listar, filtrar por estatus, ordenar por precio y **buscar por texto**.
- Marcar como vendido (lugar de venta, precio real) → genera registro en el **historial de ventas**.
- Marcar como descartado (siempre con confirmación + motivo).
- Editar artículos y agregar nuevos.
- **Historial de ventas** con el precio real (`precioVenta`).

**No incluye (no-goals)**
- Compras, lotes, corte de caja, descuentos ni PDV con carrito.
- Multiusuario o backend/sincronización en la nube.
- **Respaldo/export (CSV/JSON)** — decisión D8: no.
- **Reversibilidad** de venta o descarte — decisión D7: no.

---

## 3. Requerimientos identificados (borrador original)

1. La premisa es más sencilla que los anteriores: solo registrar inventario de cosas/artículos a vender. Un artículo registra precio sugerido, fotografía (opcional), descripción, un campo de detalles, fecha de registro (no visible) y estatus: "Almacenado", "En venta", "Vendido" o "Descartado".
2. Igual que los PWA anteriores: pantalla de inicio, botón de configuración y el botón principal "Gestionar".
3. En "Gestionar": listado de artículos filtrable por estatus u ordenable por precio. Al seleccionar uno se muestra el detalle con la opción de marcar como vendido (indicar lugar de la venta y si fue al precio sugerido; si no, especificar precio de venta) y la opción de marcar como descartado indicando el motivo.
4. En la pantalla principal también se muestra el botón "Cositas": abre un listado simple de artículos donde al seleccionar se pueden editar y deslizar a la izquierda cambia el estatus a descartado. Esa pantalla tiene la opción de agregar artículos nuevos.

---

## 4. Modelo de datos

Dos object stores en IndexedDB (`DB_NAME=VentaCositas`). Config en `localStorage`.

### 4.1 `articulos`

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string (uuid) | Clave primaria |
| `nombre` | string | Título del artículo |
| `descripcion` | string | Descripción legible |
| `detalles` | string | Campo independiente de detalles/observaciones |
| `precioSugerido` | number | Base para ordenar por precio |
| `foto` | blob \| null | Opcional, **comprimida (resize canvas) antes de guardar** |
| `fechaRegistro` | timestamp | Oculta en UI |
| `estatus` | enum | `almacenado` \| `en-venta` \| `vendido` \| `descartado` |
| `fechaVenta` | timestamp \| null | Solo si `vendido` |
| `fechaDescarte` | timestamp \| null | Solo si `descartado` |
| `motivoDescarte` | string \| null | Solo si `descartado` |
| `ventaId` | string \| null | Referencia a `ventas` si `vendido` |

### 4.2 `ventas` (historial)

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string (uuid) | Clave primaria |
| `articuloId` | string | Referencia al artículo |
| `nombre` | string | Snapshot del nombre |
| `precioSugerido` | number | Snapshot |
| `precioVenta` | number | Precio real de venta |
| `lugarVenta` | string | Lugar de la venta |
| `vendidoAlPrecioSugerido` | bool | true = se vendió al precio sugerido |
| `fechaVenta` | timestamp | Fecha de la venta |

---

## 5. Pantallas

1. **Inicio** — `Gestionar` (principal), `Historial`, `Configuración`.
2. **Artículos** — vista única con **dos modos** (toggle interno):
   - **Modo Cositas** (simple): listado simple, agregar (`+`), editar al seleccionar, swipe izquierda → confirmación + motivo → descartar.
   - **Modo Gestión**: listado con filtro por estatus, orden por precio, búsqueda por texto; tap → detalle.
3. **Detalle** — información completa + "Marcar como vendido" (lugar, precio real / precio sugerido) + "Marcar como descartado" (motivo).
4. **Historial** — listado de ventas ordenado por fecha, con nombre, precio de venta, lugar y fecha.
5. **Configuración** — opciones básicas (por definir en implementación).

---

## 6. Estados y transiciones (congeladas)

- **Alta**: nace con estatus `almacenado`.
- `almacenado` ⇄ `en-venta`: **manual** (ambos sentidos, desde el detalle/edición).
- `almacenado` / `en-venta` → `vendido`: manual; requiere lugar de venta y precio (al precio sugerido o precio real). Genera registro en `ventas`.
- activo → `descartado`: manual; **siempre con confirmación + motivo** (tanto desde detalle como por swipe).
- `vendido` y `descartado` son **terminales** (sin reversibilidad).
- Sin respaldo/export: un descarte o venta erróneos son permanentes.

---

## 7. Arquitectura técnica de referencia

Reutilizar el shell probado en TamalitosAPP y MercaditoShop:

- SPA Vanilla JS ES6, sin framework ni bundler.
- **Hash Router** (compatibilidad iOS Standalone, no History API).
- **Store reactivo** (patrón Observer).
- **IndexedDB** con wrapper CRUD genérico (`db.js`), no localStorage.
- **Service Worker** cache-first (offline).
- Componentes reutilizables: `modal`, `toast`, `swipe-item`.
- **Compresión de fotos** con canvas (resize) antes de guardar en IndexedDB.
- Sin `export.js` (D8: no respaldo). Sin `date-filter` salvo que el historial lo requiera.
- Estructura `Codigo/` (index.html, manifest.json, sw.js, css/, js/), `Documentacion/`, `odd/tasks/`.
- Deploy en Vercel (`outputDirectory: "Codigo"`).
- Tests deterministas en `scripts/test.mjs` (lógica de negocio: transiciones, snapshots, compresión).

Diferencia con los anteriores: 5 pantallas (vs 12), sin `store` de pedido/PDV; el catálogo es una sola vista con dos modos.

---

## 8. Decisiones tomadas (D1–D9)

| # | Decisión | Valor |
| --- | --- | --- |
| D1 | Nombre | **VentaCositas** |
| D2 | Pantallas | Una sola vista con 2 modos (Cositas / Gestión) |
| D3 | Alta de artículos | Solo en el modo Cositas |
| D4 | Transición de estados | Nace `almacenado`; a `en-venta` manual |
| D5 | Historial de ventas | Sí, con `precioVenta` (entidad `ventas`) |
| D6 | Descartar por swipe | Siempre confirmación + motivo |
| D7 | Reversibilidad | No |
| D8 | Respaldo | No |
| D9 | Búsqueda | Sí (por texto) |
| + | Compresión de fotos | Sí, resize canvas antes de IndexedDB |

---

## 9. Riesgo señalado

`D7` (sin reversibilidad) + `D8` (sin respaldo) = un descarte o una venta mal registrada es **irreversible y sin copia de seguridad**. Mitigación parcial ya contemplada: confirmación + motivo obligatorio antes de descartar. Se recomienda reconsiderar un respaldo mínimo a futuro, pero se respeta la decisión.
