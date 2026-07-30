import { Suspense } from "react";
import type { Metadata } from "next";
import { MonitorHomePage } from "@/features/monitor";

export const metadata: Metadata = {
  title: "SmolyanVote — Граждански монитор",
  description:
    "Поръчки, решения и разходи на община Смолян — структурирани, проверими, на прост език.",
  alternates: { canonical: "/monitor" },
};

export default function MonitorPage() {
  return (
    <Suspense>
      <MonitorHomePage />
    </Suspense>
  );
}
