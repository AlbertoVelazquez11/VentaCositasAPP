// Generador de iconos PWA (sin dependencias): PNG RGBA con caja índigo→violeta.
// Uso: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'Codigo', 'icons');

// ---------- PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // scanlines con filtro 0
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- dibujo ----------
function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    const sa = a / 255;
    buf[i] = Math.round(r * sa + buf[i] * (1 - sa));
    buf[i + 1] = Math.round(g * sa + buf[i + 1] * (1 - sa));
    buf[i + 2] = Math.round(b * sa + buf[i + 2] * (1 - sa));
    buf[i + 3] = Math.round(a + buf[i + 3] * (1 - sa));
  };

  const S = size;

  // fondo: cuadrado redondeado con gradiente índigo → violeta
  const corner = Math.round(S * 0.22);
  const inRounded = (x, y) => {
    const cx = Math.min(Math.max(x, corner), S - 1 - corner);
    const cy = Math.min(Math.max(y, corner), S - 1 - corner);
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= corner * corner;
  };
  const c1 = [79, 70, 229]; // #4F46E5
  const c2 = [124, 58, 237]; // #7C3AED
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!inRounded(x, y)) continue;
      const t = y / (S - 1);
      set(x, y, Math.round(c1[0] + (c2[0] - c1[0]) * t), Math.round(c1[1] + (c2[1] - c1[1]) * t), Math.round(c1[2] + (c2[2] - c1[2]) * t), 255);
    }
  }

  // caja blanca (paquete)
  const bx0 = Math.round(S * 0.28);
  const bx1 = Math.round(S * 0.72);
  const by0 = Math.round(S * 0.42);
  const by1 = Math.round(S * 0.78);
  const br = Math.round(S * 0.05);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (x < bx0 || x > bx1 || y < by0 || y > by1) continue;
      const cx = Math.min(Math.max(x, bx0 + br), bx1 - br);
      const cy = Math.min(Math.max(y, by0 + br), by1 - br);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= br * br) set(x, y, 255, 255, 255, 255);
    }
  }

  // cinta índigo horizontal
  const ty0 = Math.round(S * 0.55);
  const ty1 = Math.round(S * 0.65);
  for (let y = ty0; y <= ty1; y++) {
    for (let x = bx0; x <= bx1; x++) set(x, y, 79, 70, 229, 255);
  }

  return buf;
}

// ---------- salida ----------
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const size of [512, 192]) {
  const png = encodePng(size, size, makeIcon(size));
  fs.writeFileSync(path.join(OUT_DIR, `icon-${size}.png`), png);
  console.log(`✔ icon-${size}.png (${size}x${size}, ${png.length} bytes)`);
}
