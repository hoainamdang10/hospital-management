import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101',
    NEXT_PUBLIC_APP_NAME: 'Hospital Management System V2',
    NEXT_PUBLIC_APP_VERSION: '2.0.0',
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Webpack configuration
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },

  // API Rewrites - Proxy to backend services to avoid CORS
  async rewrites() {
    return [
      {
        source: '/api/v1/appointments/:path*',
        destination: 'http://localhost:3004/api/v1/appointments/:path*',
      },
      {
        source: '/api/v1/patients/:path*',
        destination: 'http://localhost:3003/api/v1/patients/:path*',
      },
      {
        source: '/api/v1/staff/:path*',
        destination: 'http://localhost:3002/api/v1/staff/:path*',
      },
      {
        source: '/api/v1/departments/:path*',
        destination: 'http://localhost:3025/api/v1/departments/:path*',
      },
      {
        source: '/api/v1/clinical/:path*',
        destination: 'http://localhost:3007/api/v1/clinical/:path*',
      },
    ];
  },
};

export default nextConfig;
