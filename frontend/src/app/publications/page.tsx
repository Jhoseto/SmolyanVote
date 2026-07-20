import { Suspense } from "react";
import type { Metadata } from "next";
import { PublicationsPageClient } from "./PublicationsPageClient";

export const metadata: Metadata = {
  title: "SmolyanVote - Публикации",
  description: "Новини, инициативи и мнения от жителите на Смолян.",
  alternates: { canonical: "/publications" },
};

export default function Publications() {
  return (
    <Suspense>
      <PublicationsPageClient />
    </Suspense>
  );
}
