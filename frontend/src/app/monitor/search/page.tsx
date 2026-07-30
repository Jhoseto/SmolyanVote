import type { Metadata } from "next";
import { MonitorSearchPage } from "@/features/monitor";

export const metadata: Metadata = {
  title: "SmolyanVote — Търсене в монитора",
  alternates: { canonical: "/monitor/search" },
};

export default function Page() {
  return <MonitorSearchPage />;
}
