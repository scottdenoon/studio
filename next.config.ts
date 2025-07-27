/** @type {import('next').NextConfig} */
import { type WebpackConfig } from "next/dist/server/config-shared";

const nextConfig = {
  webpack: (config: WebpackConfig) => {
    config.experiments = {
      ...config.experiments,
      layers: true, // ✅ Enable layers
      asyncWebAssembly: true, // if you're using WASM
    };
    return config;
  },
  experimental: {
    // Remove or move these options
  },
  serverExternalPackages: ['firebase-admin'], // if needed
};

export default nextConfig;
