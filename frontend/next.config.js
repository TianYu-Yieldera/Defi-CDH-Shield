/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 开发环境性能优化
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 优化编译性能
  experimental: {
    turbo: {
      // 使用 Turbopack (Next.js 15 的新打包器)
      resolveAlias: {
        'react-native$': 'react-native-web',
      },
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      '@react-native-async-storage/async-storage': false,
    }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    // Fix for Wagmi/RainbowKit/Metamask SDK trying to import react-native
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    }

    // 优化开发环境编译速度
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 将大型库拆分为独立 chunk
            wagmi: {
              name: 'wagmi',
              test: /[\\/]node_modules[\\/](wagmi|@wagmi|viem)[\\/]/,
              priority: 40,
            },
            rainbowkit: {
              name: 'rainbowkit',
              test: /[\\/]node_modules[\\/](@rainbow-me)[\\/]/,
              priority: 40,
            },
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 30,
            },
          },
        },
      }
    }

    return config
  },
}

module.exports = nextConfig
