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

/** Home inherits site-wide SEO from root layout (icons, Organization/WebSite JSON-LD, OG). */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Home — composition only. Section order mirrors v1 `index.html`. */
export default function HomePage() {
  return (
    <>
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
