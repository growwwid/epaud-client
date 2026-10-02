import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.5", "127.0.0.1"],
  output: "standalone",
  // add image host
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.epaud.cloud',
      }
    ]
  }
};

export default nextConfig;
