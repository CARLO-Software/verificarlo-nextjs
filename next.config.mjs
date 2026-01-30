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
    ],
  },
};

export default nextConfig;
