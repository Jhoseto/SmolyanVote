import { Suspense } from "react";
import type { Metadata } from "next";
import { OAuthCallbackPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "SmolyanVote - Вход",
  robots: { index: false, follow: false },
};

export default function OAuthCallback() {
  return (
    <Suspense>
      <OAuthCallbackPage />
    </Suspense>
  );
}
