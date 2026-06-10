// Genera el favicon (src/app/favicon.ico) y los íconos PWA (public/icons/)
// a partir del escudo de La Polla Líbero. Se corre una sola vez (o al cambiar
// el logo):
//   node scripts/make-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const logo = readFileSync(`${root}/public/img/lapolla-libero.png`);
mkdirSync(`${root}/public/icons`, { recursive: true });

const BG = '#0f172a'; // slate-900: el azul/rojo del escudo pide fondo neutro oscuro

async function icon(size, padding, out) {
  const inner = Math.round(size * (1 - padding * 2));
  const logoPng = await sharp(logo).resize({ height: inner, fit: 'inside' }).png().toBuffer();
  const meta = await sharp(logoPng).metadata();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([
      {
        input: logoPng,
        left: Math.round((size - (meta.width ?? inner)) / 2),
        top: Math.round((size - (meta.height ?? inner)) / 2),
      },
    ])
    .png()
    .toFile(`${root}/public/icons/${out}`);
  console.log(`✓ public/icons/${out}`);
}

// PNG cuadrado del escudo sobre fondo transparente (para el favicon).
async function squarePng(size) {
  const logoPng = await sharp(logo).resize({ height: size, fit: 'inside' }).png().toBuffer();
  const meta = await sharp(logoPng).metadata();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: logoPng,
        left: Math.round((size - (meta.width ?? size)) / 2),
        top: Math.round((size - (meta.height ?? size)) / 2),
      },
    ])
    .png()
    .toBuffer();
}

// ICO con entradas PNG (válido desde Vista; lo aceptan todos los navegadores).
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: ícono
  header.writeUInt16LE(pngs.length, 4);

  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0); // ancho (0 = 256)
    e.writeUInt8(size === 256 ? 0 : size, 1); // alto
    e.writeUInt8(0, 2); // paleta
    e.writeUInt8(0, 3); // reservado
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por píxel
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += buf.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}

await icon(192, 0.16, 'icon-192.png');
await icon(512, 0.16, 'icon-512.png');
await icon(512, 0.26, 'icon-512-maskable.png'); // zona segura para máscaras (Android)
await icon(180, 0.16, 'apple-icon-180.png');

const favicon = buildIco(
  await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, buf: await squarePng(size) })),
  ),
);
writeFileSync(`${root}/src/app/favicon.ico`, favicon);
console.log('✓ src/app/favicon.ico');
console.log('Listo.');
