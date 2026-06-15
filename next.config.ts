import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'export' for Capacitor Android builds (npm run build)
  // Disable 'export' for Vercel deployment so dynamic routes work without strict static params
  output: process.env.VERCEL === "1" ? undefined : "export",
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
