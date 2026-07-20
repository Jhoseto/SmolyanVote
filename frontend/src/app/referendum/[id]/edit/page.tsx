import type { Metadata } from "next";
import { EditReferendumClient } from "./EditReferendumClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "SmolyanVote - Редактиране на референдум",
  robots: { index: false, follow: false },
};

export default async function EditReferendumPage({ params }: PageProps) {
  const { id } = await params;
  return <EditReferendumClient id={Number(id)} />;
}
