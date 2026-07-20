import type { Metadata } from "next";
import { ContactPage } from "@/features/contacts";

export const metadata: Metadata = {
  title: "SmolyanVote - Контакти",
  description: "Свържете се с екипа на SmolyanVote — платформата за гражданско участие в Смолян.",
  alternates: { canonical: "/contacts" },
};

export default function Contacts() {
  return <ContactPage />;
}
