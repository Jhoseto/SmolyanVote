import { Suspense } from "react";
import type { Metadata } from "next";
import { PodcastPlayer } from "@/features/podcast";

export const metadata: Metadata = {
  title: "SmolyanVote Studio — Подкаст",
  description:
    "SmolyanVote Studio — модерен подкаст за Смолян. Слушай популярни и нови епизоди, търси в реално време и управлявай плейъра от долния dock.",
  alternates: { canonical: "/podcast" },
};

export default function Podcast() {
  return (
    <Suspense>
      <PodcastPlayer />
    </Suspense>
  );
}
