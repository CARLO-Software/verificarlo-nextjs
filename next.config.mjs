/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================
  // PERFORMANCE & BANDWIDTH OPTIMIZATIONS
  // ============================================================

  // Desactiva el header X-Powered-By (reduce bytes + seguridad)
  poweredByHeader: false,

  // Habilita compresión gzip (reduce ~70% del tamaño de transferencia)
  compress: true,

  // Desactiva source maps en producción (reduce bundle size significativamente)
  productionBrowserSourceMaps: false,

  // ============================================================
  // IMAGE OPTIMIZATION
  // ============================================================
  images: {
    // Formatos modernos - AVIF es ~50% más pequeño que WebP
    formats: ['image/avif', 'image/webp'],

    // Calidad por defecto (75 es buen balance calidad/tamaño)
    // Reduce el tamaño de imagen optimizada ~30-40%
    // quality: 75, // Comentado porque puede afectar imágenes específicas

    // Tamaños de dispositivo para responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],

    // Tamaños de imagen para el atributo sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimiza las variantes de imagen generadas
    minimumCacheTTL: 31536000, // 1 año en segundos - reduce re-optimizaciones

    // Dominios externos permitidos para next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'verificarlo.com',
      },
      {
        protocol: 'https',
        hostname: '*.verificarlo.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      // ponytail: si el blog necesita más dominios, agregar aquí explícitamente
      // NO usar hostname: '**' — permite SSRF vía next/image
    ],
  },

  // ============================================================
  // BUILD OPTIMIZATIONS
  // ============================================================
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimiza imports de paquetes pesados (reduce bundle size ~20-40%)
  // Tree-shaking automático para estas librerías
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@phosphor-icons/react',
      'date-fns',
      'framer-motion',
      'zod',
    ],
  },

  // ============================================================
  // HEADERS - CACHE AGRESIVO
  // ============================================================
  async headers() {
    return [
      // Assets estáticos - cache máximo (1 año)
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Imágenes - cache largo
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Fonts - cache máximo
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // JS/CSS estáticos generados por Next.js - cache largo
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes - no cache por defecto (pueden tener datos sensibles)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      // Páginas HTML - security headers completos
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://culqi.com https://*.culqi.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://images.unsplash.com https://i.imgur.com https://verificarlo.com https://*.verificarlo.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.culqi.com https://maps.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://www.facebook.com https://analytics.tiktok.com",
              "frame-src 'self' https://www.google.com https://www.youtube.com https://culqi.com https://*.culqi.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ============================================================
  // WEBPACK CONFIG
  // ============================================================
  webpack: (config, { isServer }) => {
    // Fix para @react-pdf/renderer
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Optimización: no incluir locales de moment/date-fns que no usamos
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Excluir locales no usados de date-fns (solo español)
        'date-fns/locale': 'date-fns/locale/es',
      };
    }

    return config;
  },
};

export default nextConfig;
