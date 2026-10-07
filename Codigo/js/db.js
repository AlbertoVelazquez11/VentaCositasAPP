// db.js — wrapper async/await sobre IndexedDB + esquema v1 de VentaCositas.

export const DB_NAME = 'VentaCositas';
export const DB_VERSION = 1;

/** Object stores con su keyPath. */
export const STORES = Object.freeze({
  articulos: { keyPath: 'id' },
  ventas: { keyPath: 'id' },
});

let dbPromise = null;

/** Abre (o crea) la base de datos con las 2 object stores del dominio. */
export function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const [name, def] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: def.keyPath });
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('La base de datos está bloqueada por otra pestaña.'));
  });

  return dbPromise;
}

/** getAll(store) → array con todos los registros. */
export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/** get(store, id) → registro o undefined. */
export async function get(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** put(store, valor) → inserta o actualiza (usa el keyPath 'id'). */
export async function put(storeName, valor) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(valor);
    tx.oncomplete = () => resolve(valor);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción abortada'));
  });
}

/** remove(store, id) → elimina un registro. */
export async function remove(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción abortada'));
  });
}

// `delete` es palabra reservada en JS: se exporta como alias del CRUD de borrado.
export { remove as delete };
