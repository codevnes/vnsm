/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  eslint: {
    // Tắt ESLint trong quá trình build để tránh lỗi
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bỏ qua lỗi TypeScript trong quá trình build
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'localhost',
      'api.${DOMAIN}' // Sẽ được thay thế bởi biến môi trường
    ],
    unoptimized: false,
  },
  // Tối ưu hóa build
  experimental: {
    // Tăng hiệu suất build
    turbotrace: {
      logLevel: 'error',
    },
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig; 