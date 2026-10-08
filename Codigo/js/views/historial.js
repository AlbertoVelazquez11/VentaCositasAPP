// views/historial.js — vista #/historial: resumen de ventas + listado (Sprint 4).
import { store } from '../store.js';
import { getAll } from '../db.js';
import { ordenarArticulos, sumarVentas, formatearFecha } from '../negocio.js';
import { crearHeader } from '../components/header.js';

const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export const historial = {
  title: 'Historial',
  render(container) {
    const view = document.createElement('div');
    view.className = 'view historial';
    container.appendChild(view);

    view.appendChild(crearHeader({ titulo: 'Historial de ventas', volver: true, volverA: '/' }));

    const resumen = document.createElement('div');
    resumen.className = 'historial__resumen card';
    const resumenLabel = document.createElement('span');
    resumenLabel.className = 'historial__resumen-label';
    resumenLabel.textContent = 'Total vendido';
    const resumenTotal = document.createElement('span');
    resumenTotal.className = 'historial__resumen-total';
    resumenTotal.textContent = formatter.format(0);
    resumen.append(resumenLabel, resumenTotal);
    view.appendChild(resumen);

    const listaEl = document.createElement('ul');
    listaEl.className = 'historial__list';
    view.appendChild(listaEl);

    function crearFila(venta) {
      const li = document.createElement('li');
      li.className = 'historial__item card';

      const principal = document.createElement('div');
      principal.className = 'historial__principal';

      const nombre = document.createElement('div');
      nombre.className = 'historial__nombre';
      nombre.textContent = venta.nombre || 'Artículo';

      const lugar = document.createElement('div');
      lugar.className = 'historial__lugar';
      lugar.textContent = venta.lugarVenta || '';

      principal.append(nombre, lugar);

      const meta = document.createElement('div');
      meta.className = 'historial__meta';

      const precio = document.createElement('div');
      precio.className = 'historial__precio';
      precio.textContent = formatter.format(Number(venta.precioVenta) || 0);

      const fecha = document.createElement('div');
      fecha.className = 'historial__fecha';
      fecha.textContent = formatearFecha(venta.fechaVenta);

      meta.append(precio, fecha);
      li.append(principal, meta);

      return li;
    }

    async function cargar() {
      let ventas;
      try {
        ventas = await getAll('ventas');
        store.setState({ ventas });
      } catch (e) {
        console.warn('No se pudo leer IndexedDB:', e);
        ventas = store.getState().ventas;
      }

      const ordenadas = ordenarArticulos(ventas, { campo: 'fechaVenta', direccion: 'desc' });
      resumenTotal.textContent = formatter.format(sumarVentas(ordenadas));

      listaEl.innerHTML = '';
      if (!ordenadas.length) {
        const li = document.createElement('li');
        const stub = document.createElement('div');
        stub.className = 'stub';
        stub.innerHTML = `
          <div class="stub__icon">🧾</div>
          <div class="empty__title">Todavía no hay ventas</div>
          <p>Cuando marques un artículo como vendido, va a aparecer acá.</p>
        `;
        li.appendChild(stub);
        listaEl.appendChild(li);
        return;
      }

      for (const venta of ordenadas) {
        listaEl.appendChild(crearFila(venta));
      }
    }

    cargar();
  },
};
