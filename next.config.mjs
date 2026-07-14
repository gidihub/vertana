/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Old use-case slugs → their closest replacement (preserve SEO / inbound links).
      {
        source: "/use-cases/recruiters",
        destination: "/use-cases/recruitment-agencies",
        permanent: true,
      },
      {
        source: "/use-cases/technical-teams",
        destination: "/use-cases/technical-hiring",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
