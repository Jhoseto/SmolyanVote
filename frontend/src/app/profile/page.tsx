import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfilePageClient } from "./ProfilePageClient";

export const metadata: Metadata = {
  title: "SmolyanVote - Моят профил",
  robots: { index: false },
};

export default function Profile() {
  return (
    <Suspense>
      <ProfilePageClient />
    </Suspense>
  );
}
