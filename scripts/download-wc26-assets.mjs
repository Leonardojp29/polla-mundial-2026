// Descarga y procesa imágenes del Mundial 2026 desde Wikimedia Commons
// (licencias libres CC; ver atribución por archivo). Se corre una sola vez:
//   node scripts/download-wc26-assets.mjs
//
// Genera en public/img/wc26/:
//   trophy.webp      — Trofeo de la Copa del Mundo (foto: Djuradj Vujcic, CC)
//   ball.webp        — Balón oficial Trionda (foto: Wikimedia Commons, CC)
//   hero-azteca.webp — Estadio Azteca de noche (foto: Wikimedia Commons, CC)
//   azteca-2026.webp — Estadio Azteca rumbo a 2026 (foto: Wikimedia Commons, CC)
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = `${root}/public/img/wc26`;
mkdirSync(outDir, { recursive: true });

const COMMONS = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

async function fetchImage(title, width) {
  const url = `${COMMONS}${encodeURIComponent(title)}?width=${width}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'polla-mundial/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} bajando ${title}`);
  return Buffer.from(await res.arrayBuffer());
}

// Recorte cuadrado (para mostrar redondo con CSS) + webp pequeño.
async function squareCrop(buf, { left, top, size, out, dim = 256 }) {
  await sharp(buf)
    .extract({ left, top, width: size, height: size })
    .resize(dim, dim)
    .webp({ quality: 82 })
    .toFile(`${outDir}/${out}`);
  console.log(`✓ ${out}`);
}

async function banner(buf, out, width = 1280) {
  await sharp(buf).resize({ width }).webp({ quality: 72 }).toFile(`${outDir}/${out}`);
  console.log(`✓ ${out}`);
}

// Trofeo: NO se descarga — public/img/wc26/trophy.png es una ilustración con
// fondo transparente subida a mano; trophy.webp se regenera desde ella:
//   npx sharp -i public/img/wc26/trophy.png ... (o ver historial del repo)

// Balón Trionda: "Adidas Trionda ball.jpg" (960x540, balón al centro-izquierda).
{
  const buf = await fetchImage('Adidas Trionda ball.jpg', 960);
  await squareCrop(buf, { left: 170, top: 55, size: 465, out: 'ball.webp' });
}

// Banners del Estadio Azteca (sede inaugural).
{
  const buf = await fetchImage('Vista aérea nocturna del Estadio Azteca.jpg', 1400);
  await banner(buf, 'hero-azteca.webp');
}
{
  const buf = await fetchImage('Estadio Azteca 2026 - 01.jpg', 1400);
  await banner(buf, 'azteca-2026.webp');
}

console.log('Listo.');
