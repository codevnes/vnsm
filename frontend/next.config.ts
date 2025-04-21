import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'localhost',
      'api.vsmi.vn',
      'vsmi.vn',
      'www.vsmi.vn'
    ],
  },
};

export default nextConfig;
