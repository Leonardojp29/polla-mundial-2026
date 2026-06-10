// Convierte una cuenta en administrador (puede cargar resultados en /admin).
//   node scripts/make-admin.mjs tu-correo@ejemplo.com
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/make-admin.mjs <correo>');
  process.exit(1);
}

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await svc
  .from('profiles')
  .update({ role: 'admin' })
  .eq('email', email)
  .select('email, first_name, role');

if (error) {
  console.error('❌', error.message);
  process.exit(1);
}
if (!data?.length) {
  console.error(`❌ No existe un perfil con el correo "${email}". ¿Ya te registraste en la app?`);
  process.exit(1);
}
console.log(`✅ ${data[0].email} ahora es ${data[0].role}. Verás "⚙️ Admin" en la barra superior.`);
