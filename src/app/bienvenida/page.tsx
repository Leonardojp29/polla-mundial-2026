import Link from 'next/link';
import Image from 'next/image';
import { getAllMatches, getTopScorers } from '@/lib/publicData';
import { getStadium } from '@/lib/stadiums';
import { matchDayParts } from '@/lib/dates';
import { Countdown } from '@/components/Countdown';
import { Reveal } from '@/components/Reveal';
import { TopScorers } from '@/components/TopScorers';
import { Flag } from '@/components/Flag';
import { Avatar } from '@/components/Avatar';
import { IconCheck, LiveDot, RankBadge } from '@/components/Icons';
import { TrophyBadge } from '@/components/WcBadges';

export const metadata = {
  title: 'Polla Mundial 2026 — Pronostica el Mundial con tus amigos',
  description:
    'Predice los 104 partidos del Mundial 2026 y compite en pollas privadas con código. Marcadores en vivo y ranking al instante.',
};

const STADIUM_STRIP = ['mexico-city', 'new-york', 'monterrey', 'vancouver'] as const;
const STADIUM_NAMES: Record<(typeof STADIUM_STRIP)[number], { name: string; city: string }> = {
  'mexico-city': { name: 'Estadio Azteca', city: 'Ciudad de México' },
  'new-york': { name: 'MetLife Stadium', city: 'Nueva York' },
  'monterrey': { name: 'Estadio BBVA', city: 'Monterrey' },
  'vancouver': { name: 'BC Place', city: 'Vancouver' },
};

type TickerMatch = {
  id: number;
  status: string;
  kickoff_at: string | null;
  home_score: number | null;
  away_score: number | null;
  home: { name: string; flag_code: string | null } | null;
  away: { name: string; flag_code: string | null } | null;
  home_label: string | null;
  away_label: string | null;
};

function TickerItem({ m, hidden }: { m: TickerMatch; hidden: boolean }) {
  const { time, isToday } = matchDayParts(m.kickoff_at);
  const isLive = m.status === 'live';
  return (
    <span
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-2 text-xs text-slate-400"
    >
      {isLive ? (
        <LiveDot />
      ) : (
        <span className="font-black tabular-nums text-slate-300">{time}</span>
      )}
      <Flag code={m.home?.flag_code} className="h-3 w-[18px]" />
      <span className="font-semibold text-slate-200">{m.home?.name ?? m.home_label}</span>
      {isLive ? (
        <span className="font-black text-white">
          {m.home_score}–{m.away_score}
        </span>
      ) : (
        <span>vs</span>
      )}
      <span className="font-semibold text-slate-200">{m.away?.name ?? m.away_label}</span>
      <Flag code={m.away?.flag_code} className="h-3 w-[18px]" />
      {isToday && !isLive && (
        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-400">
          hoy
        </span>
      )}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
      <span className="h-px w-8 bg-emerald-400/60" />
      {children}
    </p>
  );
}

export default async function BienvenidaPage() {
  const [allMatches, scorers] = await Promise.all([getAllMatches(), getTopScorers()]);

  const now = Date.now();
  const firstKickoff = allMatches.find((m) => m.kickoff_at)?.kickoff_at ?? null;
  const started = !!firstKickoff && Date.parse(firstKickoff) <= now;
  const live = allMatches.filter((m) => m.status === 'live');
  const upcoming = allMatches
    .filter((m) => m.status === 'scheduled' && m.kickoff_at && Date.parse(m.kickoff_at) > now)
    .slice(0, 8);
  const ticker = [...live, ...upcoming].slice(0, 8);


  return (
    <main className="bg-slate-950 text-white antialiased">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        {/* Arte oficial como fondo lateral, fundido hacia la zona de texto */}
        <div className="absolute inset-0">
          <Image
            src="/img/wc26/landing-hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_top]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
        </div>
        {/* Trama de puntos sutil */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Nav */}
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <span className="flex items-center gap-2.5">
            <Image src="/img/lapolla-libero.webp" alt="" width={27} height={32} className="h-8 w-auto" />
            <span className="text-base font-black tracking-tight">Polla Mundial</span>
          </span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              Crear cuenta
            </Link>
          </nav>
        </header>

        {/* Hero: texto + mock del producto */}
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-20 pt-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:pb-28 lg:pt-16">
          <div>
            <div className="animate-fade-up">
              <Eyebrow>Mundial 2026 · México · EE.UU. · Canadá</Eyebrow>
            </div>
            <h1
              className="animate-fade-up mt-5 text-5xl font-black leading-[0.95] tracking-[-0.02em] sm:text-6xl lg:text-7xl"
              style={{ '--d': '0.08s' } as React.CSSProperties}
            >
              El Mundial
              <br />
              se juega
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                en tu polla.
              </span>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-base leading-relaxed text-slate-400"
              style={{ '--d': '0.18s' } as React.CSSProperties}
            >
              Predice los 104 partidos y compite con tu gente.
              Marcadores en vivo, puntos al instante, cero hojas de cálculo.
            </p>

            <div
              className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
              style={{ '--d': '0.28s' } as React.CSSProperties}
            >
              <Link
                href="/registro"
                className="rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30 active:translate-y-0 active:scale-[0.98]"
              >
                Crear mi cuenta gratis
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 px-7 py-3.5 text-sm font-bold text-slate-200 transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/5 active:translate-y-0"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <p
              className="animate-fade-up mt-4 flex items-center gap-1.5 text-xs text-slate-500"
              style={{ '--d': '0.36s' } as React.CSSProperties}
            >
              <IconCheck className="h-3.5 w-3.5 text-emerald-500" />
              Gratis, entre amigos. Te inscribes y ya estás jugando la Polla Global.
            </p>

            {!started && firstKickoff && (
              <div
                className="animate-fade-up mt-10"
                style={{ '--d': '0.44s' } as React.CSSProperties}
              >
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  El pitazo inicial
                </p>
                <Countdown targetIso={firstKickoff} />
              </div>
            )}
            {started && (
              <p
                className="animate-fade-up mt-10 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-300"
                style={{ '--d': '0.44s' } as React.CSSProperties}
              >
                <LiveDot className="h-2 w-2" /> El Mundial está en juego
              </p>
            )}
          </div>

          {/* Mock del producto (la final soñada) */}
          <div className="relative mx-auto hidden w-full max-w-sm lg:block" aria-hidden>
            {/* Tarjeta: ranking */}
            <div
              className="animate-fade-up absolute -left-10 top-10 w-64"
              style={{ '--d': '0.5s' } as React.CSSProperties}
            >
              <div
                className="animate-float rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl shadow-black/50 backdrop-blur"
                style={{ '--float-rotate': '-3deg', '--d': '0s' } as React.CSSProperties}
              >
                <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <TrophyBadge className="h-4 w-4" /> Ranking · Polla de la oficina
                </p>
                {[
                  { n: 'Leonardo', p: 47 },
                  { n: 'Tú', p: 45, me: true },
                  { n: 'Diego', p: 41 },
                ].map((r, i) => (
                  <div
                    key={r.n}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${r.me ? 'bg-emerald-500/15' : ''}`}
                  >
                    <RankBadge rank={i + 1} className="h-5 w-5 text-[10px]" />
                    <Avatar name={r.n} className="h-6 w-6 text-[9px]" />
                    <span
                      className={`flex-1 text-sm ${r.me ? 'font-black text-emerald-300' : 'text-slate-300'}`}
                    >
                      {r.n}
                    </span>
                    <span className="text-sm font-black tabular-nums">{r.p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta: la final que todos queremos */}
            <div
              className="animate-fade-up relative ml-16"
              style={{ '--d': '0.62s' } as React.CSSProperties}
            >
              <div
                className="animate-float rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/50 backdrop-blur"
                style={{ '--float-rotate': '2deg', '--d': '-3s' } as React.CSSProperties}
              >
                <p className="mb-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Final · MetLife Stadium
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex flex-col items-center gap-1.5">
                    <Flag code="ar" className="h-7 w-11" />
                    <span className="text-xs font-bold">Argentina</span>
                  </span>
                  <span className="text-center">
                    <span className="block text-2xl font-black tabular-nums">19 jul</span>
                    <span className="text-[9px] uppercase tracking-wide text-slate-500">
                      Nueva York
                    </span>
                  </span>
                  <span className="flex flex-col items-center gap-1.5">
                    <Flag code="pt" className="h-7 w-11" />
                    <span className="text-xs font-bold">Portugal</span>
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-center gap-6">
                  {[3, 2].map((v, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-sm text-slate-400">
                        −
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/50 bg-emerald-500/10 text-lg font-black tabular-nums text-emerald-300">
                        {v}
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-sm text-slate-400">
                        +
                      </span>
                    </span>
                  ))}
                </div>
                <p className="mt-3 rounded-lg bg-emerald-500/10 py-1.5 text-center text-[11px] font-bold text-emerald-300">
                  Tu pronóstico: Gana Argentina
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker de partidos reales (marquee infinito, pausa al pasar el mouse) */}
        {ticker.length > 0 && (
          <div className="relative z-10 overflow-hidden border-t border-white/5 bg-slate-950/70 backdrop-blur">
            <div className="animate-marquee flex w-max gap-10 px-6 py-3.5">
              {[...ticker, ...ticker].map((m, idx) => (
                <TickerItem key={`${m.id}-${idx}`} m={m} hidden={idx >= ticker.length} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ============================ CIFRAS ============================ */}
      <section className="border-y border-white/5">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/5 px-6 lg:grid-cols-4">
          {[
            { v: '104', l: 'partidos por predecir' },
            { v: '48', l: 'selecciones' },
            { v: '16', l: 'estadios · 3 países' },
            { v: '39', l: 'días de torneo' },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 0.08} className="px-6 py-8 first:pl-0">
              <p className="text-4xl font-black tabular-nums tracking-tight">{s.v}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================ CÓMO SE JUEGA ============================ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <Eyebrow>Cómo se juega</Eyebrow>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Tres pasos y estás compitiendo.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                Sin reglas raras ni planillas: la app cierra cada partido a su hora, sincroniza
                los marcadores y recalcula el ranking sola.
              </p>
            </Reveal>
          </div>
          <ol className="divide-y divide-white/5">
            {[
              {
                t: 'Predice cada partido',
                d: 'Marcador exacto: 5 puntos · resultado: 2 (fase de grupos). Cada partido se bloquea al pitazo inicial: nadie se copia.',
              },
              {
                t: 'La apuesta sube por fase',
                d: 'En cuartos el exacto paga 13, en semis 20 y en la final 25. Las últimas rondas pueden voltear el ranking entero.',
              },
              {
                t: 'Crea tu polla privada',
                d: 'Genera un código tipo WC26-K4PQ y mándalo por WhatsApp. Tu grupo compite aparte, con su propio ranking en vivo.',
              },
            ].map((step, i) => (
              <li key={step.t} className="py-8 first:pt-0 last:pb-0">
                <Reveal delay={i * 0.12} className="group flex gap-6">
                  <span className="text-4xl font-black tabular-nums text-white/10 transition duration-500 group-hover:text-emerald-500/60">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{step.t}</h3>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-400">
                      {step.d}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================ BENTO ============================ */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <Eyebrow>Dentro de la app</Eyebrow>
          <h2 className="mt-4 max-w-lg text-3xl font-black tracking-tight sm:text-4xl">
            Hecha para los días de partido.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* La celda "¿Quién será campeón?" (pronóstico maestro) se quitó al
              desactivar el maestro — ver historial de git. */}

          {/* Marcadores en vivo */}
          <Reveal
            delay={0.08}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
          >
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <LiveDot /> Marcadores en vivo
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Los resultados se sincronizan solos cada pocos minutos y los puntos de todas
              las pollas se recalculan al instante. Nadie carga nada a mano.
            </p>
          </Reveal>

          {/* Código privado */}
          <Reveal
            delay={0.16}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Pollas privadas
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-emerald-400/40 bg-emerald-500/5 px-3.5 py-2 font-mono text-lg font-bold tracking-widest text-emerald-300">
              WC26-K4PQ
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Un código, tu grupo de WhatsApp, y que empiece la pelea.
            </p>
          </Reveal>

          {/* Post-kickoff */}
          <Reveal
            delay={0.1}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Anticopia
                </p>
                <h3 className="mt-1 text-lg font-bold">
                  Los pronósticos se revelan con el pitazo.
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  Antes del partido nadie ve nada de nadie. Cuando arranca, se abren los
                  pronósticos de toda la polla — y empieza la conversación.
                </p>
              </div>
              <div className="flex flex-col gap-1.5" aria-hidden>
                {[
                  { n: 'Sofía', s: '2–1' },
                  { n: 'Marco', s: '1–1' },
                  { n: 'Tú', s: '2–0', me: true },
                ].map((r) => (
                  <span
                    key={r.n}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
                      r.me
                        ? 'bg-emerald-500/15 font-bold text-emerald-300'
                        : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    <Avatar name={r.n} className="h-5 w-5 text-[8px]" />
                    {r.n}
                    <span className="ml-4 font-black tabular-nums">{r.s}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ GOLEADORES ============================ */}
      {scorers.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 pb-24 text-slate-900">
          <Reveal>
            <TopScorers scorers={scorers} limit={6} />
          </Reveal>
        </section>
      )}

      {/* ============================ SEDES ============================ */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <Eyebrow>Las sedes</Eyebrow>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <h2 className="max-w-md text-3xl font-black tracking-tight sm:text-4xl">
                Del Azteca a Nueva York.
              </h2>
              <p className="max-w-xs text-sm text-slate-500">
                Cada partido con su estadio, su ciudad y su hora en Perú — directo en la ficha.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STADIUM_STRIP.map((slug, i) => (
              <Reveal
                key={slug}
                delay={i * 0.1}
                className={i % 2 === 1 ? 'lg:translate-y-6' : ''}
              >
                <figure className="group relative overflow-hidden rounded-3xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element -- webp local optimizado */}
                <img
                  src={`/img/stadiums/${slug}.webp`}
                  alt={STADIUM_NAMES[slug].name}
                  loading="lazy"
                  decoding="async"
                  className="h-44 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-56"
                />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent px-4 pb-3 pt-10">
                    <p className="text-sm font-black leading-tight">{STADIUM_NAMES[slug].name}</p>
                    <p className="text-xs text-slate-400">{STADIUM_NAMES[slug].city}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ CTA FINAL ============================ */}
      <section className="relative overflow-hidden border-t border-white/5">
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              La pelota ya {started ? 'está rodando.' : 'casi rueda.'}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-slate-400">
              Crear tu cuenta toma menos de un minuto y quedas dentro de la Polla Global.
              Después, invita a tu gente.
            </p>
            <Link
              href="/registro"
              className="mt-9 inline-block rounded-xl bg-emerald-500 px-9 py-4 text-sm font-black text-emerald-950 shadow-xl shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/35 active:translate-y-0 active:scale-[0.98]"
            >
              Jugar la Polla Mundial
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <span className="flex items-center gap-2.5">
            <Image src="/img/lapolla-libero.webp" alt="" width={24} height={28} className="h-7 w-auto opacity-80" />
            <span className="text-sm font-bold text-slate-400">
              Polla Mundial · Mundial 2026
            </span>
          </span>
          <nav className="flex gap-5 text-sm text-slate-500">
            <Link href="/login" className="transition hover:text-white">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="transition hover:text-white">
              Crear cuenta
            </Link>
          </nav>
        </div>
        <p className="border-t border-white/5 px-6 py-4 text-center text-[11px] text-slate-600">
          Proyecto entre amigos. El emblema y las marcas del Mundial pertenecen a FIFA.
        </p>
      </footer>
    </main>
  );
}
