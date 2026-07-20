import type { Metadata } from "next";
import { AuthRouteRedirect } from "@/features/auth/components/AuthRouteRedirect";

export const metadata: Metadata = {
  title: "SmolyanVote - Забравена парола",
  description: "Възстановяване на парола в SmolyanVote.",
  alternates: { canonical: "/forgotten_password" },
  robots: { index: false, follow: false },
};

export default function ForgottenPassword() {
  return <AuthRouteRedirect view="forgot" />;
}
