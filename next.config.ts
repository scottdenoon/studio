/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: any) => {
    config.experiments = {
      ...config.experiments,
      layers: true, // ✅ Enable layers
      asyncWebAssembly: true, // if you're using WASM
    };
    return config;
  },
  serverExternalPackages: ['firebase-admin'], // if needed
};

export default nextConfig;
