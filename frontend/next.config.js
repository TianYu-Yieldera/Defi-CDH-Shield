/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
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
    return config
  },
}

module.exports = nextConfig
