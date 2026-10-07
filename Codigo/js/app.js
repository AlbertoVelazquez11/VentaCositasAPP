// app.js — bootstrap del shell: registra rutas, arranca el router y calienta IndexedDB.
import { iniciar, registrarRuta } from './router.js';
import { openDB } from './db.js';
import { home } from './views/home.js';
import { articulos } from './views/articulos.js';
import { historial } from './views/historial.js';
import { config } from './views/config.js';

// Rutas del shell.
registrarRuta('/', home);
registrarRuta('/articulos', articulos);
registrarRuta('/historial', historial);
registrarRuta('/config', config);

// Calentar IndexedDB (no bloquea el arranque si no está disponible).
openDB().catch((e) => console.warn('IndexedDB no disponible:', e));

iniciar();
