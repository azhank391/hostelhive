const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js to treat client folder as the root for file tracing
  outputFileTracingRoot: __dirname,

  // Alternative: Point to workspace root but be explicit
  // outputFileTracingRoot: path.join(__dirname, '../'),

  // Maximum SWC performance (Next.js 15 compatible)

  // Next.js 15 experimental features for speed
  experimental: {
    optimizePackageImports: ["react", "react-dom"], // Removed lucide-react to fix module resolution
    optimizeCss: true,
  },

  // Next.js 15 moved options to root level
  typescript: {
    ignoreBuildErrors: false, // Re-enable TypeScript checking during build
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  serverExternalPackages: [],
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Optimized image configuration for faster builds
  images: {
    formats: ["image/webp"], // Reduce formats for faster processing
    deviceSizes: [640, 828, 1200, 1920], // Fewer device sizes for faster builds
    imageSizes: [32, 64, 128, 256], // Fewer image sizes
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Maximum aggressive webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // ALWAYS apply lucide-react alias (both dev and production)
    config.resolve.alias = {
      ...config.resolve.alias,
      "lucide-react": path.resolve(
        __dirname,
        "node_modules/lucide-react/dist/esm/lucide-react.js"
      ),
    };

    // Ensure proper module resolution for lucide-react
    config.resolve.extensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ...(config.resolve.extensions || []),
    ];
    config.resolve.mainFields = ["browser", "module", "main"];

    // Production optimizations
    if (!dev && !isServer) {
      // Disable source maps for faster builds
      config.devtool = false;

      // Maximum tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = true;
      config.optimization.minimize = true;

      // Ultra-aggressive chunk splitting for faster builds
      config.optimization.splitChunks = {
        chunks: "all",
        maxSize: 50000, // 50KB chunks for maximum parallelization
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            chunks: "all",
            priority: 20,
            enforce: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
            enforce: true,
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Remove all performance hints
      config.performance = false;

      // Only disable BundleAnalyzerPlugin for faster builds (keep TypeScript and ESLint)
      config.plugins = config.plugins.filter((plugin) => {
        const pluginName = plugin.constructor.name;
        return !["BundleAnalyzerPlugin"].includes(pluginName);
      });

      // Maximum parallelization
      config.parallelism = require("os").cpus().length;

      // Faster module resolution
      config.resolve.symlinks = false;
      config.resolve.cacheWithContext = false;

      // Enable persistent caching for faster subsequent builds
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Development optimizations
    if (dev) {
      // Faster development builds
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }

    // Bundle analyzer (only in development)
    if (dev && process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "server",
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }

    return config;
  },

  // Compression
  compress: true,

  // Powered by header
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects for better SEO and performance
  async redirects() {
    return [];
  },

  // Rewrites for API optimization
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
