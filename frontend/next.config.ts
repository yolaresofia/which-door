import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
    // or just: domains: ['cdn.sanity.io'],
  },
  env: {
    SC_DISABLE_SPEEDY: 'false',
  },
}

export default nextConfig
