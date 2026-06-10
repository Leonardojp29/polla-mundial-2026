import { COUNTRY_GROUPS, ALL_COUNTRIES, OTHER_COUNTRY } from '@/lib/countries';

// Select de país agrupado por región. Si el valor guardado no está en la lista
// (p. ej. escrito a mano antes de este cambio), se preselecciona "Otro".
export function CountrySelect({
  id,
  name = 'country',
  defaultValue,
  required,
  className,
}: {
  id: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const value = defaultValue
    ? ALL_COUNTRIES.includes(defaultValue)
      ? defaultValue
      : OTHER_COUNTRY
    : '';

  return (
    <select id={id} name={name} defaultValue={value} required={required} className={className}>
      <option value="">— Selecciona —</option>
      {COUNTRY_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </optgroup>
      ))}
      <option value={OTHER_COUNTRY}>{OTHER_COUNTRY}</option>
    </select>
  );
}
