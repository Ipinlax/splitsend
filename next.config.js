/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: force HTTPS redirects, strict mode
  reactStrictMode: true,

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co",
              "frame-src https://js.paystack.co",
              "img-src 'self' data: blob: https:",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Prevent exposing server details
  poweredByHeader: false,

  // Only NEXT_PUBLIC_ vars are safe to expose to client
  env: {},

  // Image domains if needed
  images: {
    remotePatterns: [],
  },

  // Redirect www to non-www in production
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
