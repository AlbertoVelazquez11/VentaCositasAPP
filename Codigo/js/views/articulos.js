// views/articulos.js — vista #/articulos: modo Cositas (funcional) + modo Gestión (Sprint 3).
import { store } from '../store.js';
import { getAll, put } from '../db.js';
import {
  ESTATUS,
  crearArticulo,
  validarArticulo,
  esTerminal,
  filtrarArticulos,
  ordenarArticulos,
  buscarArticulos,
  descartarArticulo,
  venderArticulo,
} from '../negocio.js';
import { comprimirImagen, blobADataURL } from '../utils/imagen.js';
import { Modal } from '../components/modal.js';
import { mostrarToast } from '../components/toast.js';
import { activarSwipe } from '../components/swipe-item.js';
import { crearHeader } from '../components/header.js';

const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Devuelve un src usable para la foto (data URL directa, o object URL para Blobs legados). */
function fotoSrc(foto) {
  if (!foto) return null;
  if (typeof foto === 'string') return foto;
  if (typeof Blob !== 'undefined' && foto instanceof Blob) return URL.createObjectURL(foto);
  return null;
}

const ETIQUETAS_ESTATUS = {
  [ESTATUS.ALMACENADO]: 'Almacenado',
  [ESTATUS.EN_VENTA]: 'En venta',
  [ESTATUS.VENDIDO]: 'Vendido',
  [ESTATUS.DESCARTADO]: 'Descartado',
};

const BADGE_ESTATUS = {
  [ESTATUS.ALMACENADO]: 'badge--almacenado',
  [ESTATUS.EN_VENTA]: 'badge--en-venta',
  [ESTATUS.VENDIDO]: 'badge--vendido',
  [ESTATUS.DESCARTADO]: 'badge--descartado',
};

// El modo persiste en memoria durante la sesión; arranca en Cositas.
let modo = 'cositas';

// Estado del modo Gestión (persiste durante la sesión).
let filtroGestion = 'todos';
let ordenGestion = 'asc'; // 'asc' = precio ↑, 'desc' = precio ↓
let busquedaGestion = '';

export const articulos = {
  title: 'Artículos',
  render(container) {
    const view = document.createElement('div');
    view.className = 'view articulos';
    container.appendChild(view);

    const header = crearHeader({ titulo: 'Artículos', volver: true, volverA: '/' });

    const toggle = document.createElement('div');
    toggle.className = 'segmented';
    toggle.setAttribute('role', 'tablist');

    const btnCositas = crearBotonToggle('Cositas', 'cositas');
    const btnGestion = crearBotonToggle('Gestión', 'gestion');
    toggle.append(btnCositas, btnGestion);

    const body = document.createElement('div');
    body.className = 'articulos__body';

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'fab';
    fab.setAttribute('aria-label', 'Agregar artículo');
    fab.textContent = '+';
    fab.addEventListener('click', () => abrirFormulario(null));

    view.append(header, toggle, body, fab);

    function crearBotonToggle(texto, valor) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'segmented__item';
      b.textContent = texto;
      b.addEventListener('click', () => {
        modo = valor;
        pintar();
      });
      return b;
    }

    function pintar() {
      btnCositas.classList.toggle('segmented__item--active', modo === 'cositas');
      btnGestion.classList.toggle('segmented__item--active', modo === 'gestion');
      btnCositas.setAttribute('aria-selected', String(modo === 'cositas'));
      btnGestion.setAttribute('aria-selected', String(modo === 'gestion'));
      fab.classList.toggle('hidden', modo !== 'cositas');

      if (modo === 'gestion') {
        pintarGestion(body);
        return;
      }
      cargarYPintarCositas(body);
    }

    async function cargarYPintarCositas(containerEl) {
      try {
        const lista = await getAll('articulos');
        store.setState({ articulos: lista });
        pintarLista(containerEl, lista);
      } catch (e) {
        console.warn('No se pudo leer IndexedDB:', e);
        pintarLista(containerEl, store.getState().articulos);
      }
    }

    function pintarGestion(containerEl) {
      containerEl.querySelectorAll('img[src^="blob:"]').forEach((img) => URL.revokeObjectURL(img.src));
      containerEl.innerHTML = '';

      const controles = document.createElement('div');
      controles.className = 'gestion__controles';

      const buscador = document.createElement('input');
      buscador.type = 'text';
      buscador.className = 'gestion__busqueda';
      buscador.placeholder = 'Buscar por nombre, descripción o detalles…';
      buscador.value = busquedaGestion;
      buscador.setAttribute('aria-label', 'Buscar artículos');
      buscador.addEventListener('input', () => {
        busquedaGestion = buscador.value;
        pintarResultadoGestion();
      });

      const chips = document.createElement('div');
      chips.className = 'gestion__chips';
      chips.setAttribute('role', 'group');
      chips.setAttribute('aria-label', 'Filtrar por estatus');

      const OPCIONES_FILTRO = [
        { valor: 'todos', etiqueta: 'Todos' },
        { valor: ESTATUS.ALMACENADO, etiqueta: 'Almacenado' },
        { valor: ESTATUS.EN_VENTA, etiqueta: 'En venta' },
        { valor: ESTATUS.VENDIDO, etiqueta: 'Vendido' },
        { valor: ESTATUS.DESCARTADO, etiqueta: 'Descartado' },
      ];

      const chipsEls = OPCIONES_FILTRO.map((op) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        const texto = document.createElement('span');
        texto.textContent = op.etiqueta;
        const cuenta = document.createElement('span');
        cuenta.className = 'chip__count';
        b.append(texto, cuenta);
        b.addEventListener('click', () => {
          filtroGestion = op.valor;
          pintarResultadoGestion();
        });
        chips.appendChild(b);
        return { el: b, valor: op.valor, cuenta };
      });

      const orden = document.createElement('button');
      orden.type = 'button';
      orden.className = 'btn btn--ghost gestion__orden';
      orden.addEventListener('click', () => {
        ordenGestion = ordenGestion === 'asc' ? 'desc' : 'asc';
        pintarResultadoGestion();
      });

      const listaEl = document.createElement('ul');
      listaEl.className = 'articulos__list';

      controles.append(buscador, chips, orden);
      containerEl.append(controles, listaEl);

      let listaBase = [];

      (async () => {
        let lista;
        try {
          lista = await getAll('articulos');
          store.setState({ articulos: lista });
        } catch (e) {
          console.warn('No se pudo leer IndexedDB:', e);
          lista = store.getState().articulos;
        }
        listaBase = lista;
        pintarResultadoGestion();
      })();

      function pintarResultadoGestion() {
        const filtradas = filtrarArticulos(listaBase, filtroGestion);
        const buscadas = buscarArticulos(filtradas, busquedaGestion);
        const ordenadas = ordenarArticulos(buscadas, { campo: 'precioSugerido', direccion: ordenGestion });

        for (const chip of chipsEls) {
          const activo = chip.valor === filtroGestion;
          chip.el.classList.toggle('chip--active', activo);
          chip.el.setAttribute('aria-pressed', String(activo));
          const total = chip.valor === 'todos'
            ? listaBase.length
            : listaBase.filter((a) => a.estatus === chip.valor).length;
          chip.cuenta.textContent = String(total);
        }

        orden.textContent = ordenGestion === 'asc' ? 'Precio ↑' : 'Precio ↓';
        orden.setAttribute('aria-label', orden.textContent);

        listaEl.querySelectorAll('img[src^="blob:"]').forEach((img) => URL.revokeObjectURL(img.src));
        listaEl.innerHTML = '';

        if (!ordenadas.length) {
          const li = document.createElement('li');
          const stub = document.createElement('div');
          stub.className = 'stub';
          stub.innerHTML = `
            <div class="stub__icon">🔍</div>
            <div class="empty__title">Sin resultados</div>
            <p>No hay artículos que coincidan con los filtros.</p>
          `;
          li.appendChild(stub);
          listaEl.appendChild(li);
          return;
        }

        for (const articulo of ordenadas) {
          listaEl.appendChild(crearFilaGestion(articulo));
        }
      }
    }

    function pintarLista(containerEl, lista) {
      // Revoca los object URLs de thumbnails anteriores antes de redibujar.
      containerEl.querySelectorAll('img[src^="blob:"]').forEach((img) => URL.revokeObjectURL(img.src));
      containerEl.innerHTML = '';
      if (!lista || lista.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'stub';
        empty.innerHTML = `
          <div class="stub__icon">🧸</div>
          <div class="empty__title">Todavía no hay cositas</div>
          <p>Tocá el botón “+” para registrar tu primer artículo.</p>
        `;
        containerEl.appendChild(empty);
        return;
      }

      const ul = document.createElement('ul');
      ul.className = 'articulos__list';
      for (const articulo of lista) {
        ul.appendChild(crearFila(articulo));
      }
      containerEl.appendChild(ul);
    }

    function construirFila(articulo) {
      const li = document.createElement('li');
      li.className = 'swipe-item';
      li.dataset.id = articulo.id;

      const content = document.createElement('div');
      content.className = 'articulo';
      const terminal = esTerminal(articulo.estatus);
      if (terminal) content.classList.add('articulo--terminal');

      const thumb = document.createElement('div');
      thumb.className = 'articulo__thumb';
      if (articulo.foto) {
        const img = document.createElement('img');
        img.src = fotoSrc(articulo.foto);
        img.alt = '';
        thumb.appendChild(img);
      } else {
        thumb.classList.add('articulo__thumb--empty');
        thumb.textContent = '📦';
      }

      const info = document.createElement('div');
      info.className = 'articulo__info';
      const nombre = document.createElement('div');
      nombre.className = 'articulo__nombre';
      nombre.textContent = articulo.nombre;
      const precio = document.createElement('div');
      precio.className = 'articulo__precio';
      precio.textContent = formatter.format(Number(articulo.precioSugerido) || 0);
      const badge = document.createElement('span');
      badge.className = `badge ${BADGE_ESTATUS[articulo.estatus] || 'badge--neutral'}`;
      badge.textContent = ETIQUETAS_ESTATUS[articulo.estatus] || articulo.estatus;
      info.append(nombre, precio, badge);

      content.append(thumb, info);
      li.appendChild(content);
      return { li, content };
    }

    function crearFila(articulo) {
      const { li, content } = construirFila(articulo);
      const terminal = esTerminal(articulo.estatus);

      content.addEventListener('click', () => {
        if (content._swipeReciente) {
          content._swipeReciente = false;
          return;
        }
        abrirFormulario(articulo);
      });

      if (!terminal) {
        activarSwipe(content, {
          onSwipe: () => confirmarDescarte(articulo),
        });
      }

      return li;
    }

    function crearFilaGestion(articulo) {
      const { li, content } = construirFila(articulo);
      content.addEventListener('click', () => abrirDetalle(articulo));
      return li;
    }

    function abrirFormulario(articulo = null) {
      const form = document.createElement('form');
      form.className = 'formulario';
      form.noValidate = true;

      const erroresEl = document.createElement('div');
      erroresEl.className = 'formulario__errores';
      erroresEl.hidden = true;

      const campo = (etiqueta, input) => {
        const label = document.createElement('label');
        label.className = 'formulario__campo';
        const span = document.createElement('span');
        span.className = 'formulario__etiqueta';
        span.textContent = etiqueta;
        label.append(span, input);
        return label;
      };

      const nombreInput = document.createElement('input');
      nombreInput.type = 'text';
      nombreInput.name = 'nombre';
      nombreInput.placeholder = 'Ej. Llavero tejido';
      nombreInput.value = articulo?.nombre ?? '';

      const descripcionInput = document.createElement('textarea');
      descripcionInput.name = 'descripcion';
      descripcionInput.rows = 2;
      descripcionInput.placeholder = 'Descripción breve';
      descripcionInput.value = articulo?.descripcion ?? '';

      const detallesInput = document.createElement('textarea');
      detallesInput.name = 'detalles';
      detallesInput.rows = 3;
      detallesInput.placeholder = 'Detalles, medidas, materiales…';
      detallesInput.value = articulo?.detalles ?? '';

      const precioInput = document.createElement('input');
      precioInput.type = 'number';
      precioInput.name = 'precioSugerido';
      precioInput.min = '0';
      precioInput.step = '0.01';
      precioInput.inputMode = 'decimal';
      precioInput.placeholder = '0.00';
      precioInput.value = articulo?.precioSugerido ?? '';

      const fotoInput = document.createElement('input');
      fotoInput.type = 'file';
      fotoInput.name = 'foto';
      fotoInput.accept = 'image/*';
      fotoInput.hidden = true;

      const fotoPreview = document.createElement('div');
      fotoPreview.className = 'formulario__foto';

      let fotoActual = articulo?.foto ?? null;

      function pintarFoto() {
        [...fotoPreview.children].forEach((c) => { if (c !== fotoInput) c.remove(); });
        fotoPreview.appendChild(fotoInput);

        if (fotoActual) {
          const img = document.createElement('img');
          img.className = 'formulario__foto-img';
          img.src = fotoSrc(fotoActual);
          img.alt = 'Foto';
          fotoPreview.appendChild(img);
        } else {
          const vacio = document.createElement('div');
          vacio.className = 'formulario__foto-empty';
          vacio.textContent = 'Sin foto';
          fotoPreview.appendChild(vacio);
        }

        const acciones = document.createElement('div');
        acciones.className = 'formulario__foto-acciones';

        const btnCambiar = document.createElement('button');
        btnCambiar.type = 'button';
        btnCambiar.className = 'btn btn--ghost';
        btnCambiar.textContent = fotoActual ? 'Cambiar foto' : 'Agregar foto';
        btnCambiar.addEventListener('click', () => fotoInput.click());
        acciones.appendChild(btnCambiar);

        if (fotoActual) {
          const btnQuitar = document.createElement('button');
          btnQuitar.type = 'button';
          btnQuitar.className = 'btn btn--ghost';
          btnQuitar.textContent = 'Quitar foto';
          btnQuitar.addEventListener('click', () => { fotoActual = null; pintarFoto(); });
          acciones.appendChild(btnQuitar);
        }

        fotoPreview.appendChild(acciones);
      }

      fotoInput.addEventListener('change', async () => {
        const archivo = fotoInput.files?.[0];
        if (!archivo) return;
        try {
          fotoActual = await comprimirImagen(archivo);
          pintarFoto();
        } catch (e) {
          mostrarErrores({ foto: 'No se pudo procesar la imagen.' });
        }
      });

      pintarFoto();

      let estatusSelect = null;
      if (articulo && !esTerminal(articulo.estatus)) {
        estatusSelect = document.createElement('select');
        estatusSelect.name = 'estatus';
        estatusSelect.setAttribute('aria-label', 'Estatus');

        const opAlmacenado = document.createElement('option');
        opAlmacenado.value = ESTATUS.ALMACENADO;
        opAlmacenado.textContent = 'Almacenado';
        const opEnVenta = document.createElement('option');
        opEnVenta.value = ESTATUS.EN_VENTA;
        opEnVenta.textContent = 'En venta';

        estatusSelect.append(opAlmacenado, opEnVenta);
        estatusSelect.value = articulo.estatus;
      }

      form.append(
        erroresEl,
        campo('Nombre', nombreInput),
        campo('Descripción', descripcionInput),
        campo('Detalles', detallesInput),
        campo('Precio sugerido (MXN)', precioInput),
        ...(estatusSelect ? [campo('Estatus', estatusSelect)] : []),
        campo('Foto', fotoPreview)
      );

      const modal = new Modal({
        titulo: articulo ? 'Editar artículo' : 'Nuevo artículo',
        cuerpo: form,
        botones: [
          { texto: 'Cancelar', variante: 'ghost', onClick: (m) => m.cerrar() },
          { texto: 'Guardar', variante: 'primary', onClick: (m) => guardar(m) },
        ],
      });

      function mostrarErrores(errores) {
        const mensajes = Object.values(errores || {}).filter(Boolean);
        if (!mensajes.length) {
          erroresEl.hidden = true;
          erroresEl.textContent = '';
          return;
        }
        erroresEl.textContent = mensajes.join(' ');
        erroresEl.hidden = false;
      }

      async function guardar(m) {
        const datos = {
          nombre: nombreInput.value.trim(),
          descripcion: descripcionInput.value.trim(),
          detalles: detallesInput.value.trim(),
          precioSugerido: precioInput.value,
        };

        const { ok, errores } = validarArticulo(datos);
        if (!ok) {
          mostrarErrores(errores);
          return;
        }

        let fotoFinal = fotoActual;
        if (fotoFinal && typeof Blob !== 'undefined' && fotoFinal instanceof Blob) {
          try {
            fotoFinal = await blobADataURL(fotoFinal);
          } catch (e) {
            mostrarErrores({ foto: 'No se pudo leer la imagen.' });
            return;
          }
        }

        const base = {
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          detalles: datos.detalles,
          precioSugerido: Number(datos.precioSugerido),
          ...(estatusSelect ? { estatus: estatusSelect.value } : {}),
        };

        const guardado = articulo
          ? { ...articulo, ...base, foto: fotoFinal }
          : crearArticulo({ ...base, ...(fotoFinal ? { foto: fotoFinal } : {}) });

        try {
          await put('articulos', guardado);
        } catch (e) {
          console.warn('No se pudo guardar:', e);
          mostrarErrores({ guardado: 'No se pudo guardar el artículo.' });
          return;
        }

        const lista = store.getState().articulos;
        const idx = lista.findIndex((a) => a.id === guardado.id);
        const nueva = idx >= 0
          ? lista.map((a) => (a.id === guardado.id ? guardado : a))
          : [...lista, guardado];
        store.setState({ articulos: nueva });
        m.cerrar();
        mostrarToast(articulo ? 'Artículo actualizado.' : 'Artículo guardado.');
        pintarLista(body, nueva);
      }

      modal.abrir();
    }

    function confirmarDescarte(articulo) {
      const modal = new Modal({
        titulo: 'Descartar artículo',
        cuerpo: `¿Descartar “${articulo.nombre}”? Esta acción no se puede deshacer.`,
        motivo: true,
        botones: [
          { texto: 'Cancelar', variante: 'ghost', onClick: (m) => m.cerrar() },
          {
            texto: 'Descartar',
            variante: 'danger',
            onClick: (m, motivoTexto) => {
              if (!motivoTexto) {
                m.mostrarError('El motivo es obligatorio.');
                return;
              }
              m.limpiarError();

              const actualizado = {
                ...articulo,
                estatus: ESTATUS.DESCARTADO,
                motivoDescarte: motivoTexto,
                fechaDescarte: Date.now(),
              };

              put('articulos', actualizado)
                .then(() => {
                  const lista = store.getState().articulos.map((a) =>
                    a.id === articulo.id ? actualizado : a
                  );
                  store.setState({ articulos: lista });
                  m.cerrar();
                  mostrarToast('Artículo descartado.');
                  pintarLista(body, lista);
                })
                .catch(() => {
                  m.mostrarError('No se pudo descartar el artículo.');
                });
            },
          },
        ],
      });

      modal.abrir();
    }

    function campoDetalle(etiqueta, texto) {
      const wrap = document.createElement('div');
      wrap.className = 'detalle__campo';
      const label = document.createElement('span');
      label.className = 'detalle__etiqueta';
      label.textContent = etiqueta;
      const valor = document.createElement('div');
      valor.className = 'detalle__texto';
      valor.textContent = texto;
      wrap.append(label, valor);
      return wrap;
    }

    function formatearFecha(ts) {
      if (!ts) return '';
      try {
        return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(ts));
      } catch {
        return String(ts);
      }
    }

    function abrirDetalle(articulo) {
      const cuerpo = document.createElement('div');
      cuerpo.className = 'detalle';

      const foto = document.createElement('div');
      foto.className = 'detalle__foto';
      if (articulo.foto) {
        const img = document.createElement('img');
        img.src = fotoSrc(articulo.foto);
        img.alt = articulo.nombre || '';
        foto.appendChild(img);
      } else {
        foto.classList.add('detalle__foto--empty');
        foto.textContent = '📦';
      }

      const nombre = document.createElement('h3');
      nombre.className = 'detalle__nombre';
      nombre.textContent = articulo.nombre;

      const precio = document.createElement('div');
      precio.className = 'detalle__precio';
      precio.textContent = formatter.format(Number(articulo.precioSugerido) || 0);

      const badge = document.createElement('span');
      badge.className = `badge ${BADGE_ESTATUS[articulo.estatus] || 'badge--neutral'}`;
      badge.textContent = ETIQUETAS_ESTATUS[articulo.estatus] || articulo.estatus;

      cuerpo.append(foto, nombre, precio, badge);

      if (articulo.descripcion) cuerpo.appendChild(campoDetalle('Descripción', articulo.descripcion));
      if (articulo.detalles) cuerpo.appendChild(campoDetalle('Detalles', articulo.detalles));
      if (articulo.estatus === ESTATUS.VENDIDO) {
        cuerpo.appendChild(campoDetalle('Fecha de venta', formatearFecha(articulo.fechaVenta)));
      }
      if (articulo.estatus === ESTATUS.DESCARTADO) {
        cuerpo.appendChild(campoDetalle('Motivo de descarte', articulo.motivoDescarte || '—'));
      }

      const modal = new Modal({
        titulo: 'Detalle del artículo',
        cuerpo,
        botones: [{ texto: 'Cerrar', variante: 'ghost', onClick: (m) => m.cerrar() }],
      });

      if (!esTerminal(articulo.estatus)) {
        const acciones = document.createElement('div');
        acciones.className = 'detalle__acciones';

        const btnVender = document.createElement('button');
        btnVender.type = 'button';
        btnVender.className = 'btn btn--primary btn--block';
        btnVender.textContent = 'Marcar como vendido';
        btnVender.addEventListener('click', () => {
          modal.cerrar();
          abrirFormularioVenta(articulo);
        });

        const btnDescartar = document.createElement('button');
        btnDescartar.type = 'button';
        btnDescartar.className = 'btn btn--danger btn--block';
        btnDescartar.textContent = 'Marcar como descartado';
        btnDescartar.addEventListener('click', () => {
          modal.cerrar();
          confirmarDescarteDesdeDetalle(articulo);
        });

        acciones.append(btnVender, btnDescartar);
        cuerpo.appendChild(acciones);
      }

      modal.abrir();
    }

    function abrirFormularioVenta(articulo) {
      const form = document.createElement('form');
      form.className = 'formulario';
      form.noValidate = true;

      const erroresEl = document.createElement('div');
      erroresEl.className = 'formulario__errores';
      erroresEl.hidden = true;

      const toggleWrap = document.createElement('label');
      toggleWrap.className = 'venta__toggle';
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = true;
      const toggleTexto = document.createElement('span');
      toggleTexto.textContent = 'Se vendió al precio sugerido';
      toggleWrap.append(toggle, toggleTexto);

      const precioCampo = (() => {
        const label = document.createElement('label');
        label.className = 'formulario__campo';
        const span = document.createElement('span');
        span.className = 'formulario__etiqueta';
        span.textContent = 'Precio de venta (MXN)';
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = '0.01';
        input.inputMode = 'decimal';
        input.placeholder = '0.00';
        input.value = articulo.precioSugerido ?? '';
        label.append(span, input);
        return { label, input };
      })();

      const lugarCampo = (() => {
        const label = document.createElement('label');
        label.className = 'formulario__campo';
        const span = document.createElement('span');
        span.className = 'formulario__etiqueta';
        span.textContent = 'Lugar de venta';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Ej. Feria, Mercado Libre, Instagram…';
        label.append(span, input);
        return { label, input };
      })();

      const sincronizar = () => {
        precioCampo.label.classList.toggle('hidden', toggle.checked);
      };
      toggle.addEventListener('change', sincronizar);
      sincronizar();

      form.append(erroresEl, toggleWrap, precioCampo.label, lugarCampo.label);

      const modal = new Modal({
        titulo: 'Marcar como vendido',
        cuerpo: form,
        botones: [
          { texto: 'Cancelar', variante: 'ghost', onClick: (m) => m.cerrar() },
          { texto: 'Confirmar venta', variante: 'primary', onClick: (m) => guardar(m) },
        ],
      });

      function mostrarErrores(mensaje) {
        if (!mensaje) {
          erroresEl.hidden = true;
          erroresEl.textContent = '';
          return;
        }
        erroresEl.textContent = mensaje;
        erroresEl.hidden = false;
      }

      async function guardar(m) {
        const vendidoAlSugerido = toggle.checked;
        const precioVenta = vendidoAlSugerido
          ? Number(articulo.precioSugerido)
          : Number(precioCampo.input.value);

        const datosVenta = {
          lugarVenta: lugarCampo.input.value.trim(),
          precioVenta,
          vendidoAlPrecioSugerido: vendidoAlSugerido,
        };

        let resultado;
        try {
          resultado = venderArticulo(articulo, datosVenta);
        } catch (e) {
          mostrarErrores(e.message);
          return;
        }
        mostrarErrores('');

        try {
          await put('ventas', resultado.venta);
          await put('articulos', resultado.articulo);
        } catch (e) {
          console.warn('No se pudo guardar la venta:', e);
          mostrarErrores('No se pudo guardar la venta.');
          return;
        }

        const lista = store.getState().articulos.map((a) =>
          a.id === articulo.id ? resultado.articulo : a
        );
        const ventas = [...store.getState().ventas, resultado.venta];
        store.setState({ articulos: lista, ventas });

        m.cerrar();
        mostrarToast('Artículo vendido.');
        pintar();
      }

      modal.abrir();
    }

    function confirmarDescarteDesdeDetalle(articulo) {
      const modal = new Modal({
        titulo: 'Descartar artículo',
        cuerpo: `¿Descartar “${articulo.nombre}”? Esta acción no se puede deshacer.`,
        motivo: true,
        botones: [
          { texto: 'Cancelar', variante: 'ghost', onClick: (m) => m.cerrar() },
          {
            texto: 'Descartar',
            variante: 'danger',
            onClick: (m, motivoTexto) => {
              let actualizado;
              try {
                actualizado = descartarArticulo(articulo, motivoTexto);
              } catch (e) {
                m.mostrarError(e.message);
                return;
              }
              m.limpiarError();

              put('articulos', actualizado)
                .then(() => {
                  const lista = store.getState().articulos.map((a) =>
                    a.id === articulo.id ? actualizado : a
                  );
                  store.setState({ articulos: lista });
                  m.cerrar();
                  mostrarToast('Artículo descartado.');
                  pintar();
                })
                .catch(() => {
                  m.mostrarError('No se pudo descartar el artículo.');
                });
            },
          },
        ],
      });

      modal.abrir();
    }

    pintar();
  },
};
