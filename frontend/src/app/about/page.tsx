import type { Metadata } from "next";
import { AboutHero, AboutSections } from "@/features/about";

export const metadata: Metadata = {
  title: "Философия - SmolyanVote | Платформа за гражданско участие в Смолян",
  description:
    "Философията на SmolyanVote — платформа за гражданско участие в Смолян. Мисия, визия и цели за по-активна местна демокрация.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: "Философия - SmolyanVote",
    description: "Философията на SmolyanVote — гражданско участие, прозрачност и общност в Смолян.",
    url: "https://smolyanvote.com/about",
    images: ["https://smolyanvote.com/images/SMVshare.JPG"],
    locale: "bg_BG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Философия - SmolyanVote",
    description: "Философията на SmolyanVote — гражданско участие, прозрачност и общност в Смолян.",
    images: ["https://smolyanvote.com/images/SMVshare.JPG"],
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutSections />
    </>
  );
}
