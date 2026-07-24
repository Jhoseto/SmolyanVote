import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageClient } from "@/features/admin";
import { LogoLoader } from "@/shared/ui";

export const metadata: Metadata = {
  title: "SmolyanVote - Админ панел",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <Suspense fallback={<LogoLoader fullScreen size="lg" label="Зареждане…" />}>
      <AdminPageClient />
    </Suspense>
  );
}
