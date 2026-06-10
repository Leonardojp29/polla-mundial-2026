// Normalización de nombres de selecciones para emparejar football-data.org
// con nuestra tabla teams (la usan el sync y las fichas de selección).
export const normTeamName = (s: string | null | undefined) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

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
