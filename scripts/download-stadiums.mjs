// Descarga las fotos de los 16 estadios del Mundial 2026 desde Wikimedia
// Commons (licencias libres) y las deja optimizadas en public/img/stadiums/.
// El slug coincide con src/lib/stadiums.ts (mapeo venue de la BD → imagen).
//   node scripts/download-stadiums.mjs
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = `${root}/public/img/stadiums`;
mkdirSync(outDir, { recursive: true });

// slug → títulos de archivo en Commons (en orden de preferencia).
const STADIUM_FILES = {
  'atlanta': [
    'Mercedes-Benz Stadium, Atlanta, GA (46558861755).jpg',
    'Mercedes-Benz Stadium, December 2024.jpg',
  ],
  'boston': ['Gillette Stadium (Top View).jpg'],
  'dallas': ['AT&T Stadium Aerial.jpeg'],
  'guadalajara': ['Estadio Omnilife Chivas.jpg'],
  'houston': ['Reliant Stadium Aerial.JPG'],
  'kansas-city': ['Aerial view of Arrowhead Stadium 08-31-2013 crop.jpg'],
  'los-angeles': ['Aerial view of SoFi Stadium (July 2022).jpg'],
  'mexico-city': ['Vista aérea nocturna del Estadio Azteca.jpg'],
  'miami': ['Hard Rock Stadium Prior to first NFL game.jpg'],
  'new-york': ['Metlife stadium (Aerial view).jpg'],
  'monterrey': ['Estadio BBVA Bancomer (1).jpg'],
  'philadelphia': ['Lincoln Financial Field (Aerial view).jpg'],
  'san-francisco': ["Levi's Stadium from air.jpg"],
  'seattle': ['Lumen Field north side at dusk.jpg'],
  'toronto': ['Toronto - ON - BMO Field.jpg'],
  'vancouver': ['BC Place Opening Day 2011-09-30.jpg'],
};

const UA = { 'User-Agent': 'polla-mundial/1.0 (proyecto personal)' };

async function download(slug, titles) {
  const out = `${outDir}/${slug}.webp`;
  if (existsSync(out)) {
    console.log(`· ${slug}.webp ya existe, lo salto`);
    return;
  }
  for (const title of titles) {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=1400`;
    const res = await fetch(url, { headers: UA });
    if (!res.ok) {
      console.log(`  (no encontrado: ${title})`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).resize({ width: 1280 }).webp({ quality: 72 }).toFile(out);
    console.log(`✓ ${slug}.webp ← ${title}`);
    return;
  }
  console.error(`✗ ${slug}: ninguna imagen disponible`);
}

for (const [slug, titles] of Object.entries(STADIUM_FILES)) {
  await download(slug, titles);
  await new Promise((r) => setTimeout(r, 1500)); // amable con Commons
}
console.log('Listo.');
