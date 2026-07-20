import type { Metadata } from "next";
import { EditSimpleEventClient } from "./EditSimpleEventClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "SmolyanVote - Редактиране на събитие",
  robots: { index: false, follow: false },
};

export default async function EditSimpleEventPage({ params }: PageProps) {
  const { id } = await params;
  return <EditSimpleEventClient id={Number(id)} />;
}
