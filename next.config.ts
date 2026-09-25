import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Los backups JSON pueden pesar más que el límite por defecto (1 MB).
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: {
    // Foto de perfil de Google al loguearse con ese provider (ver lib/auth/server.ts).
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
