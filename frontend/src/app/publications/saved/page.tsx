import type { Metadata } from "next";
import { SavedPublicationsPageClient } from "./SavedPublicationsPageClient";

export const metadata: Metadata = {
  title: "Запазени публикации | SmolyanVote",
  description: "Публикации, които сте запазили в местната социална мрежа на Смолян.",
  robots: { index: false, follow: false },
};

export default function SavedPublicationsPage() {
  return <SavedPublicationsPageClient />;
}
