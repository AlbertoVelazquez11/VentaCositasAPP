// views/articulos.js — vista #/articulos: modo Cositas (funcional) + modo Gestión (placeholder Sprint 3).
import { store } from '../store.js';
import { getAll, put } from '../db.js';
import { ESTATUS, crearArticulo, validarArticulo, esTerminal } from '../negocio.js';
import { comprimirImagen } from '../utils/imagen.js';
import { Modal } from '../components/modal.js';
import { mostrarToast } from '../components/toast.js';
import { activarSwipe } from '../components/swipe-item.js';

const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

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

export const articulos = {
  title: 'Artículos',
  render(container) {
    const view = document.createElement('div');
    view.className = 'view articulos';
    container.appendChild(view);

    const header = document.createElement('header');
    header.className = 'articulos__header';
    const title = document.createElement('h1');
    title.textContent = 'Artículos';
    header.appendChild(title);

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
      containerEl.innerHTML = '';
      const stub = document.createElement('div');
      stub.className = 'stub';
      stub.innerHTML = `
        <div class="stub__icon">🗂️</div>
        <div class="empty__title">Próximamente</div>
        <p>El modo Gestión (edición avanzada, ventas y cambio de estatus) llega en el Sprint 3.</p>
        <span class="badge badge--neutral">Disponible en un sprint posterior</span>
      `;
      containerEl.appendChild(stub);
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

    function crearFila(articulo) {
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
        img.src = URL.createObjectURL(articulo.foto);
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

      const fotoPreview = document.createElement('div');
      fotoPreview.className = 'formulario__foto';
      if (articulo?.foto) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(articulo.foto);
        img.alt = 'Foto actual';
        fotoPreview.appendChild(img);
      }
      fotoPreview.appendChild(fotoInput);

      form.append(
        erroresEl,
        campo('Nombre', nombreInput),
        campo('Descripción', descripcionInput),
        campo('Detalles', detallesInput),
        campo('Precio sugerido (MXN)', precioInput),
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

        let foto = articulo?.foto ?? null;
        const archivo = fotoInput.files?.[0];
        if (archivo) {
          try {
            foto = await comprimirImagen(archivo);
          } catch (e) {
            mostrarErrores({ foto: 'No se pudo procesar la imagen.' });
            return;
          }
        }

        const base = {
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          detalles: datos.detalles,
          precioSugerido: Number(datos.precioSugerido),
        };

        const guardado = articulo
          ? { ...articulo, ...base, ...(foto ? { foto } : {}) }
          : crearArticulo({ ...base, ...(foto ? { foto } : {}) });

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

    pintar();
  },
};
