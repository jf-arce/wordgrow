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
      { src: "/icons/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
