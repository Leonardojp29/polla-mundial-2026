import Image from 'next/image';
import { Flag } from '@/components/Flag';
import { IconGlobe, IconLock, IconTrendingUp } from '@/components/Icons';

// Cabezas de serie de los 12 grupos (franja decorativa).
const SEED_FLAGS = ['MX', 'CA', 'BR', 'US', 'DE', 'NL', 'BE', 'ES', 'FR', 'AR', 'PT', 'GB-ENG'];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Panel de marca (solo escritorio) */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/img/wc26/azteca-2026.webp"
          alt="Estadio Azteca, sede inaugural del Mundial 2026"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-emerald-900/80 to-emerald-950/95" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <Image
              src="/img/lapolla-libero.webp"
              alt="La Polla Líbero"
              width={41}
              height={48}
              className="h-12 w-auto drop-shadow"
            />
            <p className="text-xl font-black tracking-tight">Polla Mundial</p>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-black leading-tight">
              La polla del Mundial 2026, con tus amigos.
            </h1>
            <ul className="mt-8 space-y-4 text-emerald-100">
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <IconGlobe className="h-5 w-5 text-emerald-300" />
                </span>
                <span>
                  <strong className="text-white">Polla Global</strong> — al registrarte ya estás
                  jugando contra todos.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <IconLock className="h-5 w-5 text-emerald-300" />
                </span>
                <span>
                  <strong className="text-white">Pollas privadas</strong> — crea la tuya y comparte
                  el código por WhatsApp.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <IconTrendingUp className="h-5 w-5 text-emerald-300" />
                </span>
                <span>
                  <strong className="text-white">Ranking en vivo</strong> — predice los 104
                  partidos y suma puntos.
                </span>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {SEED_FLAGS.map((code) => (
                <Flag key={code} code={code} className="h-5 w-7 opacity-90" />
              ))}
            </div>
            <p className="text-sm text-emerald-200/80">
              11 de junio — 19 de julio de 2026 · 48 selecciones · 104 partidos · 3 países
            </p>
          </div>
        </div>
      </aside>

      {/* Formulario */}
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <Image
              src="/img/lapolla-libero.webp"
              alt="La Polla Líbero"
              width={48}
              height={56}
              className="mb-2 h-14 w-auto"
            />
            <p className="text-3xl font-black tracking-tight">Polla Mundial</p>
            <p className="text-sm text-slate-500">Mundial 2026</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
