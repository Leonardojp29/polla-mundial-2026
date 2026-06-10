// Países disponibles en el formulario (select). No es la lista completa:
// Sudamérica + potencias de Norteamérica/Europa/Oceanía; el resto usa "Otro".
export const COUNTRY_GROUPS = [
  {
    label: 'Sudamérica',
    countries: [
      'Perú',
      'Argentina',
      'Bolivia',
      'Brasil',
      'Chile',
      'Colombia',
      'Ecuador',
      'Paraguay',
      'Uruguay',
      'Venezuela',
    ],
  },
  {
    label: 'Norteamérica',
    countries: ['Canadá', 'Estados Unidos', 'México'],
  },
  {
    label: 'Europa',
    countries: ['Alemania', 'España', 'Francia', 'Inglaterra', 'Italia', 'Países Bajos', 'Portugal'],
  },
  {
    label: 'Oceanía',
    countries: ['Australia', 'Nueva Zelanda'],
  },
] as const;

export const ALL_COUNTRIES: string[] = COUNTRY_GROUPS.flatMap((g) => [...g.countries]);

export const OTHER_COUNTRY = 'Otro';
