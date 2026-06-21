/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

const nextConfig = {
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
