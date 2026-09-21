/** @type {import('next').NextConfig} */
const nextConfig = {
  // Preview/tunnel hosts (127.0.0.1 vs localhost) must be allowed or
  // Next.js 16 blocks /_next assets and the UI appears frozen.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.localhost",
    "**.cursor.com",
    "*.cursor.com",
    "**.cursor.sh",
    "*.cursor.sh",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["bcryptjs"],
  async redirects() {
    return [
      { source: "/vendor", destination: "/owner/dashboard", permanent: false },
      { source: "/vendor/login", destination: "/owner/login", permanent: false },
      { source: "/vendor/claims", destination: "/owner/claims", permanent: false },
    ]
  },
}

export default nextConfig
