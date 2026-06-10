// Normalización de nombres de selecciones para emparejar football-data.org
// con nuestra tabla teams (la usan el sync y las fichas de selección).
export const normTeamName = (s: string | null | undefined) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

// Nombres en español (clave: nombre en inglés normalizado). La BD y
// football-data quedan en inglés (el sync empareja por esos nombres); esto es
// SOLO capa de presentación, aplicada en publicData y en los .ics.
const TEAM_NAME_ES: Record<string, string> = {
  algeria: 'Argelia',
  argentina: 'Argentina',
  australia: 'Australia',
  austria: 'Austria',
  belgium: 'Bélgica',
  bosniaherzegovina: 'Bosnia y Herzegovina',
  bosniaandherzegovina: 'Bosnia y Herzegovina',
  brazil: 'Brasil',
  canada: 'Canadá',
  capeverde: 'Cabo Verde',
  caboverde: 'Cabo Verde',
  colombia: 'Colombia',
  croatia: 'Croacia',
  curacao: 'Curazao',
  czechrepublic: 'República Checa',
  czechia: 'República Checa',
  drcongo: 'RD del Congo',
  congodr: 'RD del Congo',
  ecuador: 'Ecuador',
  egypt: 'Egipto',
  england: 'Inglaterra',
  france: 'Francia',
  germany: 'Alemania',
  ghana: 'Ghana',
  haiti: 'Haití',
  iran: 'Irán',
  iriran: 'Irán',
  iraq: 'Irak',
  ivorycoast: 'Costa de Marfil',
  cotedivoire: 'Costa de Marfil',
  japan: 'Japón',
  jordan: 'Jordania',
  mexico: 'México',
  morocco: 'Marruecos',
  netherlands: 'Países Bajos',
  newzealand: 'Nueva Zelanda',
  norway: 'Noruega',
  panama: 'Panamá',
  paraguay: 'Paraguay',
  portugal: 'Portugal',
  qatar: 'Catar',
  saudiarabia: 'Arabia Saudita',
  scotland: 'Escocia',
  senegal: 'Senegal',
  southafrica: 'Sudáfrica',
  southkorea: 'Corea del Sur',
  korearepublic: 'Corea del Sur',
  spain: 'España',
  sweden: 'Suecia',
  switzerland: 'Suiza',
  tunisia: 'Túnez',
  turkey: 'Turquía',
  turkiye: 'Turquía',
  unitedstates: 'Estados Unidos',
  usa: 'Estados Unidos',
  uruguay: 'Uruguay',
  uzbekistan: 'Uzbekistán',
};

export function esTeamName(name: string): string {
  return TEAM_NAME_ES[normTeamName(name)] ?? name;
}

// alias: nombre de football-data (normalizado) → nombre nuestro (normalizado)
export const TEAM_ALIAS: Record<string, string> = {
  korearepublic: 'southkorea',
  cotedivoire: 'ivorycoast',
  czechia: 'czechrepublic',
  turkiye: 'turkey',
  unitedstates: 'usa',
  caboverde: 'capeverde',
  capeverdeislands: 'capeverde',
  congodr: 'drcongo',
  bosniaandherzegovina: 'bosniaherzegovina',
  iriran: 'iran',
};
