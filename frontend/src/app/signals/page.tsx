import { Suspense } from "react";
import type { Metadata } from "next";
import { SignalsPageClient } from "./SignalsPageClient";

export const metadata: Metadata = {
  title: "SmolyanVote - Граждански сигнали",
  description: "Карта на гражданските сигнали в област Смолян — дупки, осветление, замърсяване и други проблеми.",
  alternates: { canonical: "/signals" },
};

export default function Signals() {
  return (
    <Suspense>
      <SignalsPageClient />
    </Suspense>
  );
}
