import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'export' for Capacitor Android builds (npm run build)
  // Comment this out for Vercel deployment
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
