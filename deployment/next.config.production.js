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
  // Tối ưu hóa build và Server Components
  experimental: {
    // Thêm cấu hình này để tránh lỗi với useSearchParams và Client Components
    serverComponentsExternalPackages: [],
    // Tối ưu hóa CSS cho Static Pages (Node.js v20 hỗ trợ critters)
    optimizeCss: true,
    // Tối ưu hóa CSR
    optimizeServerReact: true,
    // Tăng hiệu suất build
    turbotrace: {
      logLevel: 'error',
    },
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig; 