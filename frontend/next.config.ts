import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/images/**', // Be specific about the path if possible
      },
      // Add other allowed domains here if needed
    ],
  },
};

export default nextConfig;
