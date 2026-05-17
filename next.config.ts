import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-navigation-menu', '@radix-ui/react-switch', '@radix-ui/react-label'],
    optimizeCss: true,
    optimizeServerReact: true,
  },
};

export default nextConfig;
