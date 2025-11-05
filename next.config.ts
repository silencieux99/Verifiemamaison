import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Configuration pour les images distantes
    remotePatterns: [
      { protocol: "https", hostname: "blob.vercel-storage.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 768, 1024, 1280],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // ESLint désactivé - utilisation de TypeScript uniquement
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vérification TypeScript stricte avant le build
    // La vérification est faite dans le script prebuild via "npm run type-check"
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [];
  },
  reactStrictMode: true,
};

export default nextConfig;

