import { redirect } from 'next/navigation';

// Al entrar a una polla, directo a predecir (el grupo del próximo partido
// se selecciona solo en la página de predicciones).
export default async function PoolIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/pollas/${id}/predicciones`);
}
