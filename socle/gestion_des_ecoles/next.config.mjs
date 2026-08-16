/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisation pour connexions faibles
  images: {
    // Désactiver les images optimisées pour réduire la charge serveur
    unoptimized: true,
    // Formats légers
    formats: ['image/webp'],
  },
  
  // Compression
  compress: true,
  
  // Optimisation de la production
  swcMinify: true,
  
  // Réduire la taille des bundles
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  
  // Headers de cache pour les assets statiques
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
