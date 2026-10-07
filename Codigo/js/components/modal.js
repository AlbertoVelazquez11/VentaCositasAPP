// components/modal.js — modal genérico (título, cuerpo, botones) + variante con textarea de motivo.
// Browser-only: lo importan las vistas (no los tests de Node).

export class Modal {
  constructor({ titulo = '', cuerpo = '', botones = [], motivo = false } = {}) {
    this.el = document.createElement('div');
    this.el.className = 'modal-overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', titulo);

    const card = document.createElement('div');
    card.className = 'modal';
    card.setAttribute('role', 'document');

    const header = document.createElement('div');
    header.className = 'modal__header';
    const titleEl = document.createElement('h2');
    titleEl.className = 'modal__title';
    titleEl.textContent = titulo;
    header.appendChild(titleEl);

    const body = document.createElement('div');
    body.className = 'modal__body';
    if (typeof cuerpo === 'string') {
      const p = document.createElement('p');
      p.textContent = cuerpo;
      body.appendChild(p);
    } else if (cuerpo && typeof cuerpo === 'object' && cuerpo.nodeType) {
      body.appendChild(cuerpo);
    }

    this.motivoEl = null;
    this.errorEl = null;
    if (motivo) {
      const field = document.createElement('div');
      field.className = 'modal__field';
      const label = document.createElement('label');
      label.textContent = 'Motivo';
      const textarea = document.createElement('textarea');
      textarea.name = 'motivo';
      textarea.rows = 3;
      textarea.placeholder = '¿Por qué lo descartás?';
      this.motivoEl = textarea;
      label.appendChild(textarea);

      this.errorEl = document.createElement('div');
      this.errorEl.className = 'modal__error';
      this.errorEl.hidden = true;
      field.append(label, this.errorEl);
      body.appendChild(field);
    }

    const footer = document.createElement('div');
    footer.className = 'modal__footer';
    for (const boton of botones) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn ${boton.variante ? `btn--${boton.variante}` : 'btn--ghost'}`;
      btn.textContent = boton.texto;
      btn.addEventListener('click', () => boton.onClick?.(this, this.leerMotivo()));
      footer.appendChild(btn);
    }

    card.append(header, body, footer);
    this.el.appendChild(card);

    this._onKeydown = (e) => {
      if (e.key === 'Escape') this.cerrar();
    };
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.cerrar();
    });
  }

  leerMotivo() {
    return this.motivoEl ? this.motivoEl.value.trim() : '';
  }

  mostrarError(mensaje) {
    if (!this.errorEl) return;
    this.errorEl.textContent = mensaje;
    this.errorEl.hidden = false;
  }

  limpiarError() {
    if (!this.errorEl) return;
    this.errorEl.textContent = '';
    this.errorEl.hidden = true;
  }

  abrir() {
    document.body.appendChild(this.el);
    document.addEventListener('keydown', this._onKeydown);
    if (this.motivoEl) this.motivoEl.focus();
  }

  cerrar() {
    document.removeEventListener('keydown', this._onKeydown);
    this.el.remove();
  }
}
