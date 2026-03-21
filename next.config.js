/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@shelby-protocol/sdk'],
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@telegram-apps/bridge': false,
    }
    return config
  },
}

module.exports = nextConfig
