/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/mymusicalroom',
  assetPrefix: '/mymusicalroom',
  output: 'standalone', // Enable standalone output for Docker
}

module.exports = nextConfig

