import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias["@taququr/ui/theme.css"] = path.resolve(
      __dirname,
      "../packages/ui/dist/theme.css"
    );
    return config;
  },
  // output: "export",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // logging: {
  //   fetches: {
  //     fullUrl: true,
  //   },
  // },
  experimental: {
    viewTransition: true,
    serverActions: {
      // bodySizeLimit: "2mb",
      allowedOrigins: ["taququr.com", "www.taququr.com"],
    },
  },
};

export default nextConfig;
