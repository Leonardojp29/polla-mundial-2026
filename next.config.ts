import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
