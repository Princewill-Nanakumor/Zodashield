/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "2mb",
    },
  },

  // Optimize bundle and performance
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "https://zodashield.com/",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // Updated: 1 year cache for better performance
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  webpack: (config, { dev, isServer }) => {
    // Video file handling
    config.module.rules.push({
      test: /\.(mp4|webm|mov)$/,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/static/videos/",
          outputPath: "static/videos/",
          name: "[name].[hash].[ext]",
        },
      },
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // Enhanced optimization for production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 200000, // Reduced for better loading
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk (React, Next.js)
            framework: {
              name: "framework",
              chunks: "all",
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Common chunks across pages
            commons: {
              name: "commons",
              chunks: "all",
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Large libraries
            lib: {
              test(module) {
                return (
                  module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier())
                );
              },
              name(module) {
                const packageName = module
                  .identifier()
                  .split("/")
                  .slice(-1)[0]
                  .split(".")[0];
                return `chunk-${packageName}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Framer Motion optimization
            framerMotion: {
              name: "framer-motion",
              chunks: "all",
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 35,
              enforce: true,
            },
            // Lucide icons optimization
            lucide: {
              name: "lucide-react",
              chunks: "all",
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 35,
              enforce: true,
            },
          },
        },
        runtimeChunk: { name: "runtime" },
        // Additional performance optimizations
        usedExports: true,
        sideEffects: false,
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.cloudinary.com https://flagcdn.com",
              "media-src 'self' blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.cloudinary.com",
              "frame-src 'self'",
            ].join("; "),
          },
          // Performance headers
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Static assets caching
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API routes caching
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=60",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
