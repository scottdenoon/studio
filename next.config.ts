
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Remove or move these options
  },
  serverExternalPackages: ['firebase-admin'], // if needed
  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
    };
    return config;
  }
};

export default nextConfig;
