import type { MetadataRoute } from "next";

/** Web app manifest — brand logo icons for install / SEO / AI agents. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmolyanVote",
    short_name: "SmolyanVote",
    description:
      "Независима платформа за истинско гражданско участие в Смолян. Гласувания, сигнали, публикации и общност.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#19861c",
    lang: "bg",
    dir: "ltr",
    categories: ["social", "news", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
