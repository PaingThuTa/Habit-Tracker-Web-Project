/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/habit-tracker',
  reactStrictMode: true,
  basePath: '/habit-tracker',
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
}

export default nextConfig
