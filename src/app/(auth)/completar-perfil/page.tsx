import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CompleteProfileForm } from '@/components/CompleteProfileForm';

// Onboarding tras el primer login con Google: el trigger ya creó el perfil con
// los datos que da Google (nombre/avatar); aquí se completan usuario, país y
// contraseña. Usa el layout de (auth) (panel de marca + formulario).
export default async function CompletarPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, username, country')
    .eq('id', user.id)
    .single();

  return (
    <CompleteProfileForm
      email={user.email ?? ''}
      profile={{
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        username: profile?.username ?? '',
        country: profile?.country ?? '',
      }}
    />
  );
}
