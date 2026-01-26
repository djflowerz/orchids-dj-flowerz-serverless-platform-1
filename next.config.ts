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
  webpack: (config) => {
    // Remove aliases for node modules, rely on externals mapping
    // config.resolve.alias = { ... }; 

    config.externals = [...(config.externals || []), {
      // Map standard Node modules to "node:" prefixed requires for Cloudflare nodejs_compat
      'assert': 'commonjs node:assert',
      'child_process': 'commonjs node:child_process',
      'cluster': 'commonjs node:cluster',
      'constants': 'commonjs node:constants',
      'crypto': 'commonjs node:crypto',
      'dgram': 'commonjs node:dgram',
      'dns': 'commonjs node:dns',
      'domain': 'commonjs node:domain',
      'events': 'commonjs node:events',
      'fs': 'commonjs node:fs',
      'http': 'commonjs node:http',
      'https': 'commonjs node:https',
      'http2': 'commonjs node:http2',
      'module': 'commonjs node:module',
      'net': 'commonjs node:net',
      'os': 'commonjs node:os',
      'path': 'commonjs node:path',
      'punycode': 'commonjs node:punycode',
      'querystring': 'commonjs node:querystring',
      'readline': 'commonjs node:readline',
      'repl': 'commonjs node:repl',
      'stream': 'commonjs node:stream',
      'string_decoder': 'commonjs node:string_decoder',
      'sys': 'commonjs node:sys',
      'timers': 'commonjs node:timers',
      'tls': 'commonjs node:tls',
      'tty': 'commonjs node:tty',
      'url': 'commonjs node:url',
      'util': 'commonjs node:util',
      'vm': 'commonjs node:vm',
      'zlib': 'commonjs node:zlib',

      // Ensure node: prefixed imports also resolve (though redundant if using above map, good for safety)
      'node:assert': 'commonjs node:assert',
      'node:buffer': 'commonjs node:buffer',
      'node:child_process': 'commonjs node:child_process',
      'node:cluster': 'commonjs node:cluster',
      'node:console': 'commonjs node:console',
      'node:constants': 'commonjs node:constants',
      'node:crypto': 'commonjs node:crypto',
      'node:dgram': 'commonjs node:dgram',
      'node:dns': 'commonjs node:dns',
      'node:domain': 'commonjs node:domain',
      'node:events': 'commonjs node:events',
      'node:fs': 'commonjs node:fs',
      'node:http': 'commonjs node:http',
      'node:https': 'commonjs node:https',
      'node:http2': 'commonjs node:http2',
      'node:module': 'commonjs node:module',
      'node:net': 'commonjs node:net',
      'node:os': 'commonjs node:os',
      'node:path': 'commonjs node:path',
      'node:punycode': 'commonjs node:punycode',
      'node:process': 'commonjs node:process',
      'node:querystring': 'commonjs node:querystring',
      'node:readline': 'commonjs node:readline',
      'node:repl': 'commonjs node:repl',
      'node:stream': 'commonjs node:stream',
      'node:string_decoder': 'commonjs node:string_decoder',
      'node:sys': 'commonjs node:sys',
      'node:timers': 'commonjs node:timers',
      'node:tls': 'commonjs node:tls',
      'node:tty': 'commonjs node:tty',
      'node:url': 'commonjs node:url',
      'node:util': 'commonjs node:util',
      'node:vm': 'commonjs node:vm',
      'node:zlib': 'commonjs node:zlib'
    }];
    return config;
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