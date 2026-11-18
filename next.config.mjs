/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // PGlite loads its wasm via import.meta.url; must not be bundled by webpack
  serverExternalPackages: ['@electric-sql/pglite'],
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
