import { getAllMatches } from '@/lib/publicData';
import { matchesToIcs, icsResponse } from '@/lib/ics';

// .ics de un partido (descarga: Apple/iPhone/Outlook lo abren directo).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { origin } = new URL(request.url);
  const match = (await getAllMatches()).find((m) => m.id === Number(id));
  if (!match) return new Response('Partido no encontrado', { status: 404 });

  const ics = matchesToIcs('Mundial 2026', [match], origin);
  return icsResponse(ics, `partido-${id}.ics`, true);
}
