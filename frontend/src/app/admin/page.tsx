import type { Metadata } from "next";
import { AdminPageClient } from "@/features/admin";

export const metadata: Metadata = {
  title: "SmolyanVote - Админ панел",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPageClient />;
}
