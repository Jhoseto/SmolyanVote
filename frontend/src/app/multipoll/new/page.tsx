import type { Metadata } from "next";
import { CreateEventShell, CreateMultiPollForm } from "@/features/events";

export const metadata: Metadata = {
  title: "Нова анкета",
  description:
    "Създайте анкета с множествен избор — до 10 опции и до 3 избора. Съберете нюансираното мнение на гражданите.",
  alternates: { canonical: "/multipoll/new" },
};

export default function NewMultiPollPage() {
  return (
    <CreateEventShell type="multipoll">
      <CreateMultiPollForm />
    </CreateEventShell>
  );
}
