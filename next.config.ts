import type { NextConfig } from "next";
import path from "node:path";
const loaderPath = require.resolve('orchids-visual-edits/loader.js');

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Required for Cloudflare Pages compatibility
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [loaderPath]
      }
    }
  }
};

export default nextConfig;
// Orchids restart: 1768855428079