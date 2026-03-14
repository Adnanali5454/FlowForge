/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.flowforge.io',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
