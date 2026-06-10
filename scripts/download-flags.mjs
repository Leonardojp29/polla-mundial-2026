// Descarga las 48 banderas del Mundial 2026 a public/flags/ (una sola vez).
// Usamos PNG de 160px (~3-5 KB c/u) en vez de SVG: los SVG con escudos detallados
// pesan cientos de KB (Ecuador 217 KB) y rasterizarlos traba el scroll.
// Fuente: flagcdn.com (Flagpedia, uso libre).
//   node scripts/download-flags.mjs
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CODES = [
  'MX', 'ZA', 'KR', 'CZ', 'CA', 'BA', 'QA', 'CH', 'BR', 'MA', 'HT', 'GB-SCT',
  'US', 'PY', 'AU', 'TR', 'DE', 'CW', 'CI', 'EC', 'NL', 'JP', 'SE', 'TN',
  'BE', 'EG', 'IR', 'NZ', 'ES', 'CV', 'SA', 'UY', 'FR', 'SN', 'IQ', 'NO',
  'AR', 'DZ', 'AT', 'JO', 'PT', 'CD', 'UZ', 'CO', 'GB-ENG', 'HR', 'GH', 'PA',
];

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'flags');
mkdirSync(outDir, { recursive: true });

let okCount = 0;
const failures = [];
for (const code of CODES) {
  const slug = code.toLowerCase();
  const file = join(outDir, `${slug}.png`);
  if (existsSync(file)) { okCount++; continue; }
  try {
    const res = await fetch(`https://flagcdn.com/w160/${slug}.png`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    // Firma PNG (las banderas de franjas lisas comprimen a <200 bytes y es normal).
    if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('no es PNG');
    writeFileSync(file, buf);
    okCount++;
  } catch (e) {
    failures.push(`${code}: ${e.message}`);
  }
}

console.log(`✅ ${okCount}/${CODES.length} banderas PNG en public/flags/`);
if (failures.length) {
  console.error('❌ Fallaron:', failures.join(' | '));
  process.exit(1);
}
