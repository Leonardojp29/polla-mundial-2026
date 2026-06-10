import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Escudos oficiales de football-data: pasan por el optimizador/caché de
    // Vercel en vez de pegarle a su CDN desde cada navegador.
    remotePatterns: [{ protocol: 'https', hostname: 'crests.football-data.org' }],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    // Estáticos versionados (banderas/imágenes): caché de 1 año, inmutable.
    const immutable = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      { source: "/flags/:path*", headers: immutable },
      { source: "/img/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;
