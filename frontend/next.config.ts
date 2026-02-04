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
    // Cache images for 31 days (reduces transformations and cache writes)
    minimumCacheTTL: 2678400,
    // Use only WebP to reduce transformations (AVIF adds extra variants)
    formats: ['image/webp'],
    // Limit device sizes to common breakpoints (reduces variants)
    deviceSizes: [640, 750, 1080, 1920],
    // Limit image sizes for smaller images (avatars, thumbnails)
    imageSizes: [32, 64, 96, 256],
    // Constrain quality options (default is 75, limit to reduce variants)
    qualities: [75],
  },
  env: {
    SC_DISABLE_SPEEDY: 'false',
  },
}

export default nextConfig
