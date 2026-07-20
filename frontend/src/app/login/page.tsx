import type { Metadata } from "next";
import { AuthRouteRedirect } from "@/features/auth/components/AuthRouteRedirect";

export const metadata: Metadata = {
  title: "SmolyanVote - Вход",
  description: "Влезте в своя профил в SmolyanVote.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function Login() {
  return <AuthRouteRedirect view="login" />;
}
