import type { MetadataRoute } from 'next';

// PWA: permite "instalar" la app desde el navegador (ícono en la pantalla de
// inicio, pantalla completa sin barra de URL).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Polla Mundial — Mundial 2026',
    short_name: 'Polla Mundial',
    description:
      'Polla del Mundial 2026: crea la tuya, comparte el código y compite con tus amigos.',
    lang: 'es',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#065f46',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
