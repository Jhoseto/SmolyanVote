import { Suspense } from "react";
import type { Metadata } from "next";
import { ConfirmPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "SmolyanVote - Потвърждение на имейл",
  robots: { index: false, follow: false },
};

export default function Confirm() {
  return (
    <Suspense>
      <ConfirmPage />
    </Suspense>
  );
}
