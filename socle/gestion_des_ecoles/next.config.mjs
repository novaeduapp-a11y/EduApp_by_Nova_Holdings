/** @type {import('next').NextConfig} */
const nextConfig = {
  // Warnings ESLint (hooks deps) ne doivent pas bloquer la build production.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  output: "standalone",
  // Optimisation pour connexions faibles
  images: {
    // Sources déjà compressées côté public/brand ; laisser Next servir telles quelles
    // évite un round-trip sharp sur le VPS (CPU / cold start).
    unoptimized: true,
  },
  
  // Compression
  compress: true,
  
  // Optimisation de la production
  swcMinify: true,
  
  // Réduire la taille des bundles. lucide-react is excluded: optimizePackageImports
  // has caused webpack "factory.call" runtime errors with Next 14 + Lucide.
  experimental: {
    optimizePackageImports: ["@tanstack/react-query"],
  },
  
  // Headers de cache : uniquement en production (en dev, les chunks n’ont pas de hash
  // et un max-age immutable bloque tout hot-reload dans le navigateur).
  async headers() {
    const apiHeaders = [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];

    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/_next/:path*",
          headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
        },
        {
          source: "/:all*(js|css)",
          headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
        },
        ...apiHeaders,
      ];
    }

    return [
      {
        source: "/:all*(svg|jpg|png|webp|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      ...apiHeaders,
    ];
  },
};

export default nextConfig;
