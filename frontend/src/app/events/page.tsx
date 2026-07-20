import { Suspense } from "react";
import type { Metadata } from "next";
import { EventsHubPage } from "@/features/events";

export const metadata: Metadata = {
  title: "SmolyanVote - Всички събития",
  description:
    "Разгледайте активните и приключилите събития, референдуми и анкети в Смолян. Гласувайте и споделете мнението си.",
  alternates: { canonical: "/events" },
};

export default function Events() {
  return (
    <Suspense>
      <EventsHubPage />
    </Suspense>
  );
}
