// store.js — estado reactivo global (patrón Observer), sin DOM.

export class Store {
  #state;
  #listeners = new Set();

  constructor(initial = {}) {
    this.#state = { ...initial };
  }

  /** Devuelve una referencia al estado actual. */
  getState() {
    return this.#state;
  }

  /** Mezcla un parche sobre el estado actual y notifica a los suscriptores. */
  setState(parcial) {
    this.#state = { ...this.#state, ...parcial };
    this.notify();
    return this.#state;
  }

  /** Registra un listener; devuelve una función para darlo de baja. */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Notifica a todos los suscriptores con el estado actual. */
  notify() {
    for (const fn of this.#listeners) fn(this.#state);
  }
}

/** Store global de la app (artículos y ventas viven en IndexedDB; aquí el estado en memoria). */
export const store = new Store({ articulos: [], ventas: [] });
