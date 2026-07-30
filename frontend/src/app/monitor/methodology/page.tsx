import type { Metadata } from "next";
import { MonitorMethodologyPage } from "@/features/monitor";

export const metadata: Metadata = {
  title: "SmolyanVote — Методология на монитора",
  alternates: { canonical: "/monitor/methodology" },
};

export default function Page() {
  return <MonitorMethodologyPage />;
}
