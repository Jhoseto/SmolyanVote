import type { Metadata } from "next";
import { AuthRouteRedirect } from "@/features/auth/components/AuthRouteRedirect";

export const metadata: Metadata = {
  title: "SmolyanVote - Регистрация",
  description: "Създайте профил в SmolyanVote.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false },
};

export default function Register() {
  return <AuthRouteRedirect view="register" />;
}
