import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  // The dev-tools badge docks bottom-left, which is exactly where the cookie
  // consent bar puts its "Accept all" button — the badge covered it.
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yebgnhxennlspkbnhwcl.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    // Production only. `immutable` tells the browser not to revalidate for a
    // year, which is correct in a build — /_next/static filenames carry a
    // content hash, so a changed file is a changed URL. In dev it is actively
    // harmful: Turbopack serves the CSS at a STABLE url (the chunk name does
    // not change between edits), so an immutable entry pins the first version
    // you ever loaded. You then edit CSS, see nothing change, and hard-refresh
    // is the only way out. Dev gets Next's own no-cache defaults instead.
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif|ico|woff2)",
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
};

export default nextConfig;
