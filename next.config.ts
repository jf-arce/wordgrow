import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Los backups JSON pueden pesar más que el límite por defecto (1 MB).
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
