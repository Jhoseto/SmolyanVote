import type { Metadata } from "next";
import { EditMultiPollClient } from "./EditMultiPollClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "SmolyanVote - Редактиране на анкета",
  robots: { index: false, follow: false },
};

export default async function EditMultiPollPage({ params }: PageProps) {
  const { id } = await params;
  return <EditMultiPollClient id={Number(id)} />;
}
