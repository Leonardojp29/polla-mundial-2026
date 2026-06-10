import { redirect } from 'next/navigation';

// Pronóstico maestro DESACTIVADO (feedback 11 jun): la polla es solo de
// predicciones de partidos. La página original (MaestroForm + ShareMaestroButton)
// queda en el historial de git por si se reactiva; mientras tanto, esta ruta
// redirige a predicciones.
export default async function MaestroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/pollas/${id}/predicciones`);
}
