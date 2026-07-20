import type { Metadata } from "next";
import {
  Hero,
  TitleSection,
  StatsVideoSection,
  MotivationPanels,
  CommunitySection,
  SupportCarousel,
  AppPromoCard,
  FinalRegistrationSection,
} from "@/features/shell";

const TITLE = "SmolyanVote - Гласът на Смолян | Вашият глас Вашият град Вашето мнение";
const DESCRIPTION =
  "Независима платформа за истинско гражданско участие в Смолян. Анкети, референдуми и обществени дискусии за развитието на града.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "https://smolyanvote.com/",
    images: ["https://smolyanvote.com/images/SMVshare.JPG"],
    locale: "bg_BG",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["https://smolyanvote.com/images/SMVshare.JPG"],
  },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SmolyanVote",
  description: "Независима платформа за истинско гражданско участие в Смолян",
  url: "https://smolyanvote.com",
  sameAs: ["https://facebook.com/smolyanvote", "https://twitter.com/smolyanvote"],
  potentialAction: {
    "@type": "SearchAction",
    target: "https://smolyanvote.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

/** Home — composition only. Section order mirrors v1 `index.html`. */
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
      />
      <Hero />
      <TitleSection />
      <StatsVideoSection />
      <MotivationPanels />
      <CommunitySection />
      <SupportCarousel />
      <AppPromoCard />
      <FinalRegistrationSection />
    </>
  );
}
