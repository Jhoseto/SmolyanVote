import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Hero, TitleSection } from "@/features/shell";

const StatsVideoSection = dynamic(() =>
  import("@/features/shell/components/StatsVideoSection").then((m) => ({
    default: m.StatsVideoSection,
  })),
);

const MotivationPanels = dynamic(() =>
  import("@/features/shell/components/MotivationPanels").then((m) => ({
    default: m.MotivationPanels,
  })),
);

const CommunitySection = dynamic(() =>
  import("@/features/shell/components/CommunitySection").then((m) => ({
    default: m.CommunitySection,
  })),
);

const SupportCarousel = dynamic(() =>
  import("@/features/shell/components/SupportCarousel").then((m) => ({
    default: m.SupportCarousel,
  })),
);

const AppPromoCard = dynamic(() =>
  import("@/features/shell/components/AppPromoCard").then((m) => ({
    default: m.AppPromoCard,
  })),
);

const FinalRegistrationSection = dynamic(() =>
  import("@/features/shell/components/FinalRegistrationSection").then((m) => ({
    default: m.FinalRegistrationSection,
  })),
);

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
