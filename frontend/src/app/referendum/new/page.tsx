import type { Metadata } from "next";
import { Card, Container } from "@/shared/ui";
import { CreateReferendumForm } from "@/features/events";

export const metadata: Metadata = {
  title: "SmolyanVote - Нов референдум",
  description: "Създайте нов референдум в SmolyanVote.",
  alternates: { canonical: "/referendum/new" },
};

export default function NewReferendumPage() {
  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)] sm:text-3xl">Нов референдум</h1>
      <Card className="max-w-2xl p-5 sm:p-6">
        <CreateReferendumForm />
      </Card>
    </Container>
  );
}
