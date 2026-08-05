import type { NextConfig } from "next";

/** Spring origin for server-side rewrites only (browser stays on :3000). */
const API_ORIGIN =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ??
  "http://localhost:2662";

/** Turbopack: empty stub. Webpack (production deploy): alias to `false`. */
const POLYFILL_STUB = "./src/lib/modern-polyfill.js";
const POLYFILL_ALIASES = {
  "../build/polyfills/polyfill-module": POLYFILL_STUB,
  "next/dist/build/polyfills/polyfill-module": POLYFILL_STUB,
} as const;

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(self), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    resolveAlias: POLYFILL_ALIASES,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "../build/polyfills/polyfill-module": false,
      "next/dist/build/polyfills/polyfill-module": false,
    };
    return config;
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 85, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy Thymeleaf / bookmark URLs → Next routes (preserve query, e.g. openSignal)
      { source: "/viewLogin", destination: "/login", permanent: false },
      { source: "/user/login", destination: "/login", permanent: false },
      { source: "/user/registration", destination: "/register", permanent: false },
      { source: "/registration", destination: "/register", permanent: false },
      { source: "/mainEvents", destination: "/events", permanent: false },
      { source: "/mainEventPage", destination: "/events", permanent: false },
      { source: "/admin/dashboard", destination: "/admin", permanent: false },
      { source: "/contact", destination: "/?contact=1", permanent: false },
      { source: "/contacts", destination: "/?contact=1", permanent: false },
      { source: "/aboutUs", destination: "/about", permanent: false },
      { source: "/signals/mainView", destination: "/signals", permanent: false },
      { source: "/signals/:id(\\d+)", destination: "/signals?openSignal=:id", permanent: false },
      { source: "/createNewEvent", destination: "/event/new", permanent: false },
      { source: "/createEvent", destination: "/event/new", permanent: false },
      { source: "/create", destination: "/events", permanent: false },
      { source: "/referendum", destination: "/referendum/new", permanent: false },
      { source: "/multipoll/createMultiPoll", destination: "/multipoll/new", permanent: false },
      { source: "/multipoll/create", destination: "/multipoll/new", permanent: false },
      { source: "/terms-conditions", destination: "/terms-and-conditions", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` },
      { source: "/admin/api/:path*", destination: `${API_ORIGIN}/admin/api/:path*` },
      { source: "/admin/users/:path*", destination: `${API_ORIGIN}/admin/users/:path*` },
      {
        source: "/admin/manage-reports/:path*",
        destination: `${API_ORIGIN}/admin/manage-reports/:path*`,
      },
      {
        source: "/admin/moderation/:path*",
        destination: `${API_ORIGIN}/admin/moderation/:path*`,
      },
      {
        source: "/admin/events/:path*",
        destination: `${API_ORIGIN}/admin/events/:path*`,
      },
      {
        source: "/admin/subscriptions",
        destination: `${API_ORIGIN}/admin/subscriptions`,
      },
      {
        source: "/admin/subscriptions/:path*",
        destination: `${API_ORIGIN}/admin/subscriptions/:path*`,
      },
      { source: "/heartbeat", destination: `${API_ORIGIN}/heartbeat` },
      {
        source: "/ws-svmessenger/:path*",
        destination: `${API_ORIGIN}/ws-svmessenger/:path*`,
      },
      { source: "/ws/:path*", destination: `${API_ORIGIN}/ws/:path*` },
    ];
  },
};

export default nextConfig;
