import { withPlausibleProxy } from 'next-plausible'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  webpack: (config) => {
    // Suppress all expression-based dependency warnings
    // - @whatwg-node/fetch causes "Critical dependency: the request of a dependency is an expression" when generating components server-side
    config.module.exprContextCritical = false
    return config
  },
  redirects: () => [
    {
      source: '/support',
      destination: 'https://t.me/%2BvzEeMpBDzWUwMThh',
      permanent: false,
    },
    {
      source: '/interest',
      destination: 'https://opencivics.notion.site/28d06d2570f2804cbf62cca8d3c0034e',
      permanent: false,
    }
  ]
}

export default withPlausibleProxy()(nextConfig)
