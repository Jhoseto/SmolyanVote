import type { Metadata } from "next";
import { Card, Container } from "@/shared/ui";
import { CreateSimpleEventForm } from "@/features/events";

export const metadata: Metadata = {
  title: "SmolyanVote - Ново събитие",
  description: "Създайте ново събитие за гласуване в SmolyanVote.",
  alternates: { canonical: "/event/new" },
};

export default function NewSimpleEventPage() {
  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)] sm:text-3xl">Ново събитие</h1>
      <Card className="max-w-2xl p-5 sm:p-6">
        <CreateSimpleEventForm />
      </Card>
    </Container>
  );
}
