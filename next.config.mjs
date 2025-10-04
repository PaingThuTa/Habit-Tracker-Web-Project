/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/habit-tracker',
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
}

export default nextConfig
