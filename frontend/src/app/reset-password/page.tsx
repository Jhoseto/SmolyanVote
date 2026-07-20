import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "SmolyanVote - Възстановяване на парола",
  robots: { index: false, follow: false },
};

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
