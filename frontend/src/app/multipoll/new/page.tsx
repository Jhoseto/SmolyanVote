import type { Metadata } from "next";
import { Card, Container } from "@/shared/ui";
import { CreateMultiPollForm } from "@/features/events";

export const metadata: Metadata = {
  title: "SmolyanVote - Нова анкета",
  description: "Създайте нова анкета в SmolyanVote.",
  alternates: { canonical: "/multipoll/new" },
};

export default function NewMultiPollPage() {
  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)] sm:text-3xl">Нова анкета</h1>
      <Card className="max-w-2xl p-5 sm:p-6">
        <CreateMultiPollForm />
      </Card>
    </Container>
  );
}
