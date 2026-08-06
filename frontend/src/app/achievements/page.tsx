import { Suspense } from "react";
import type { Metadata } from "next";
import { AchievementsPageClient } from "./AchievementsPageClient";

export const metadata: Metadata = {
  title: "SmolyanVote - Значки и постижения",
  robots: { index: false },
};

export default function AchievementsRoute() {
  return (
    <Suspense>
      <AchievementsPageClient />
    </Suspense>
  );
}
