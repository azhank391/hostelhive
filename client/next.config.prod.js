/** @type {import('next').NextConfig} */
const nextConfig = {
  // Maximum SWC performance
  swcMinify: true,
  
  // Disable telemetry for faster builds
  telemetry: false,
  
  // Aggressive experimental features for speed
  experimental: {
    optimizePackageImports: ['lucide-react'],
    swcTraceProfiling: true,
    workerThreads: true,
    cpus: Math.max(1, (Number(process.env.CPUS) || require('os').cpus().length) - 1),
    // Enable SWC for everything
    forceSwcTransforms: true,
    // Parallel compilation
    parallel: true,
    // Skip type checking during build
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    // Disable features that slow down builds
    serverComponentsExternalPackages: [],
    // Enable CSS optimization
    optimizeCss: true,
    // Disable webpack analysis
    webpackBuildWorker: false
  },

  // Minimal image optimization
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Maximum webpack performance
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Disable source maps for faster builds
      config.devtool = false;
      
      // Maximum tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = true;
      config.optimization.minimize = true;
      
      // Aggressive chunk splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 150000, // 150KB chunks
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            enforce: true
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      };

      // Performance hints
      config.performance = {
        maxEntrypointSize: 400000, // 400KB
        maxAssetSize: 400000,
        hints: 'warning'
      };
    }

    // Remove unnecessary plugins
    config.plugins = config.plugins.filter(plugin => {
      const pluginName = plugin.constructor.name;
      return !['ForkTsCheckerWebpackPlugin', 'ESLintWebpackPlugin'].includes(pluginName);
    });

    return config;
  },

  // Compression
  compress: true,

  // Powered by header
  poweredByHeader: false,

  // Minimal headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },

  // Minimal redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/owner',
        permanent: false,
      },
    ];
  },

  // Minimal rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },

  // Disable features that slow down builds
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Disable webpack analysis
  webpack5: true,
};

module.exports = nextConfig;
