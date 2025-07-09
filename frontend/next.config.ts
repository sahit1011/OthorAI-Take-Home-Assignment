import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Disable strict mode for better compatibility
  reactStrictMode: false,

  // Disable ESLint during build for Docker
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during build for Docker
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
    NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT || '30000',
    NEXT_PUBLIC_MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800',
  },

  // Configure rewrites for API proxy if needed
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
