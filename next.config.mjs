/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Dominios externos permitidos para next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Fotos de perfil de Google
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com', // Otros subdominios de Google
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Imágenes de Cloudinary
      },
      {
        protocol: 'https',
        hostname: 'verificarlo.com', // Imágenes del blog
      },
      {
        protocol: 'https',
        hostname: '*.verificarlo.com', // Subdominios de verificarlo
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash para imágenes del blog
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com', // Imgur
      },
      {
        protocol: 'https',
        hostname: '**', // Permitir cualquier dominio HTTPS para el blog
      },
    ],
  },
  // Configuración para @react-pdf/renderer
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
