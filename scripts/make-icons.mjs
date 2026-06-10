// Genera los íconos PWA (public/icons/) a partir del logo SVG, sobre fondo
// esmeralda. Se corre una sola vez (o al cambiar el logo):
//   node scripts/make-icons.mjs
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const logo = readFileSync(`${root}/public/img/wc26-logo.svg`);
mkdirSync(`${root}/public/icons`, { recursive: true });

const BG = '#065f46'; // emerald-900: contraste con el logo

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

await icon(192, 0.16, 'icon-192.png');
await icon(512, 0.16, 'icon-512.png');
await icon(512, 0.26, 'icon-512-maskable.png'); // zona segura para máscaras (Android)
await icon(180, 0.16, 'apple-icon-180.png');
console.log('Listo.');
