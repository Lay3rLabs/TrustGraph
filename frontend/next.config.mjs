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
  redirects: () => [
    {
      source: '/',
      destination: '/hyperstition',
      permanent: false,
    },
  ],
}

export default withPlausibleProxy()(nextConfig)
