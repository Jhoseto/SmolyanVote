import type { Metadata } from "next";
import { AboutHero, AboutSections } from "@/features/about";

export const metadata: Metadata = {
  title: "За нас - SmolyanVote | Платформа за гражданско участие в Смолян",
  description:
    "Научете повече за SmolyanVote - платформата за гражданско участие в град Смолян. Нашата мисия, визия и цели за развитието на местната демокрация.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: "За нас - SmolyanVote",
    description: "Научете повече за SmolyanVote - платформата за гражданско участие в град Смолян.",
    url: "https://smolyanvote.com/about",
    images: ["https://smolyanvote.com/images/SMVshare.JPG"],
    locale: "bg_BG",
  },
  twitter: {
    card: "summary_large_image",
    title: "За нас - SmolyanVote",
    description: "Научете повече за SmolyanVote - платформата за гражданско участие в град Смолян.",
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
