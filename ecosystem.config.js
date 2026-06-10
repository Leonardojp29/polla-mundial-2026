// PM2 — modo producción.
//
// Pasos previos (una vez por release):
//   npm ci          # dependencias exactas del lockfile
//   npm run build   # build de producción (lee las NEXT_PUBLIC_* del .env)
//
// Levantar / recargar:
//   pm2 start ecosystem.config.js
//   pm2 reload polla-mundial      # tras un nuevo build
//   pm2 save                      # persistir entre reinicios del servidor
//
// Variables de entorno: PM2 NO lee .env por sí solo; Next.js sí lee el
// archivo `.env` ubicado en la raíz del proyecto (cwd). Colocar ahí el .env
// de producción entregado por el equipo.
module.exports = {
  apps: [
    {
      name: 'polla-mundial',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3000',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
