import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: ['@supabase/ssr'],
  webpack: (config, { isServer }) => {
    // Fix module resolution for workspace setup
    config.resolve.modules = [
      path.resolve(__dirname, '../node_modules'),
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ];

    // Handle Node.js modules for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    return config;
  },
  // Only transpile @supabase/supabase-js for client-side usage
  transpilePackages: ['@supabase/supabase-js'],
  // Disable source maps in development to reduce bundle size
  productionBrowserSourceMaps: false,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
