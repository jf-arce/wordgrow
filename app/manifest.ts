import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WordGrow",
    short_name: "WordGrow",
    description: "Armá tu mazo, entrená con repaso espaciado y subí de rango cada carta.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d10",
    theme_color: "#16191f",
    icons: [
      { src: "/icons/fox-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/fox-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/fox-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
