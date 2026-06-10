// Fotos de jugadores vía Wikipedia (REST summary → thumbnail). football-data
// no trae fotos en el tier gratis. Cacheado 7 días en el Data Cache; si no hay
// foto (o la página es de desambiguación) se devuelve null y la UI muestra
// iniciales.
const UA = { 'User-Agent': 'polla-mundial/1.0 (proyecto personal)' };

async function summaryThumb(lang: 'es' | 'en', title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      { headers: UA, next: { revalidate: 604_800, tags: ['wiki-photos'] } },
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d.type === 'disambiguation') return null;
    return d.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export async function getPlayerPhoto(name: string): Promise<string | null> {
  return (await summaryThumb('es', name)) ?? (await summaryThumb('en', name));
}
