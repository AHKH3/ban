/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

const nextConfig = {
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  ...(isDev
    ? {}
    : {
        output: 'export',
        trailingSlash: true,
        assetPrefix: './',
      }),
  images: {
    unoptimized: true,
  },
}

export default nextConfig
