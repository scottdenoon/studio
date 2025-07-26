/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
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