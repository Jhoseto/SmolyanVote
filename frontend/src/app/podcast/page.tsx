import { Suspense } from "react";
import type { Metadata } from "next";
import { PodcastPlayer } from "@/features/podcast";

export const metadata: Metadata = {
  title: "SmolyanVote - Подкаст",
  description: "Разговори за живота в Смолян — слушай епизодите на подкаста на SmolyanVote.",
  alternates: { canonical: "/podcast" },
};

export default function Podcast() {
  return (
    <Suspense>
      <PodcastPlayer />
    </Suspense>
  );
}
