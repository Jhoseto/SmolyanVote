import type { Metadata } from "next";
import { TermsAndConditions } from "@/features/terms";

export const metadata: Metadata = {
  title: "Условия за ползване и политика за поверителност - SmolyanVote",
  description:
    "Условия за ползване и политика за поверителност на SmolyanVote. Прочетете правилата и условията за използване на платформата за гражданско участие в Смолян.",
  alternates: { canonical: "/terms-and-conditions" },
  openGraph: {
    type: "website",
    title: "Условия за ползване и политика за поверителност - SmolyanVote",
    description: "Условия за ползване и политика за поверителност на SmolyanVote.",
    url: "https://smolyanvote.com/terms-and-conditions",
    images: ["https://smolyanvote.com/images/SMVshare.JPG"],
    locale: "bg_BG",
  },
  twitter: {
    card: "summary",
    title: "Условия за ползване - SmolyanVote",
    description: "Условия за ползване и политика за поверителност на SmolyanVote.",
  },
};

export default function TermsAndConditionsPage() {
  return <TermsAndConditions />;
}
