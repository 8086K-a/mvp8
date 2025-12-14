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
  // 性能优化配置
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
      'lucide-react'
    ],
    // 启用SWC编译优化
    swcMinify: true,
  },
  // 启用代码分割优化 - 减少包大小
  modularizeImports: {
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/{{member}}',
    },
    // 只导入使用的组件
    '@radix-ui/react-dialog': {
      transform: '@radix-ui/react-dialog/{{member}}',
    },
    '@radix-ui/react-dropdown-menu': {
      transform: '@radix-ui/react-dropdown-menu/{{member}}',
    },
    '@radix-ui/react-context-menu': {
      transform: '@radix-ui/react-context-menu/{{member}}',
    },
  },
  // 优化编译输出
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 生产环境移除console.log
  },
  // Webpack优化
  webpack: (config, { dev, isServer }) => {
    // 开发环境优化
    if (dev && !isServer) {
      // 启用更快的热重载
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    // 生产环境优化
    if (!dev) {
      // 启用压缩
      config.optimization.minimize = true
      // 代码分割优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            chunks: 'all',
          },
        },
      }
    }

    return config
  },
  // 确保构建时的严格模式 - 生产环境可能有问题，暂时禁用
  reactStrictMode: false,
  // ✅ 启用生产环境 source map 以获取详细错误信息（简化版）
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production',
}

export default nextConfig
