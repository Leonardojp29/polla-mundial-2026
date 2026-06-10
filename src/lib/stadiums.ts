// Las 16 sedes del Mundial 2026. La clave es el campo `venue` tal como viene
// en la BD (seed de OpenFootball). Imágenes: scripts/download-stadiums.mjs.
export type StadiumInfo = { img: string; stadium: string; city: string };

const STADIUMS: Record<string, StadiumInfo> = {
  'Atlanta': { img: '/img/stadiums/atlanta.webp', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  'Boston (Foxborough)': { img: '/img/stadiums/boston.webp', stadium: 'Gillette Stadium', city: 'Boston' },
  'Dallas (Arlington)': { img: '/img/stadiums/dallas.webp', stadium: 'AT&T Stadium', city: 'Dallas' },
  'Guadalajara (Zapopan)': { img: '/img/stadiums/guadalajara.webp', stadium: 'Estadio Akron', city: 'Guadalajara' },
  'Houston': { img: '/img/stadiums/houston.webp', stadium: 'NRG Stadium', city: 'Houston' },
  'Kansas City': { img: '/img/stadiums/kansas-city.webp', stadium: 'Arrowhead Stadium', city: 'Kansas City' },
  'Los Angeles (Inglewood)': { img: '/img/stadiums/los-angeles.webp', stadium: 'SoFi Stadium', city: 'Los Ángeles' },
  'Mexico City': { img: '/img/stadiums/mexico-city.webp', stadium: 'Estadio Azteca', city: 'Ciudad de México' },
  'Miami (Miami Gardens)': { img: '/img/stadiums/miami.webp', stadium: 'Hard Rock Stadium', city: 'Miami' },
  'Monterrey (Guadalupe)': { img: '/img/stadiums/monterrey.webp', stadium: 'Estadio BBVA', city: 'Monterrey' },
  'New York/New Jersey (East Rutherford)': { img: '/img/stadiums/new-york.webp', stadium: 'MetLife Stadium', city: 'Nueva York/Nueva Jersey' },
  'Philadelphia': { img: '/img/stadiums/philadelphia.webp', stadium: 'Lincoln Financial Field', city: 'Filadelfia' },
  'San Francisco Bay Area (Santa Clara)': { img: '/img/stadiums/san-francisco.webp', stadium: "Levi's Stadium", city: 'San Francisco' },
  'Seattle': { img: '/img/stadiums/seattle.webp', stadium: 'Lumen Field', city: 'Seattle' },
  'Toronto': { img: '/img/stadiums/toronto.webp', stadium: 'BMO Field', city: 'Toronto' },
  'Vancouver': { img: '/img/stadiums/vancouver.webp', stadium: 'BC Place', city: 'Vancouver' },
};

export function getStadium(venue: string | null | undefined): StadiumInfo | null {
  if (!venue) return null;
  return STADIUMS[venue] ?? null;
}
