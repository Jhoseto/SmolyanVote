import { fetchMultipollOg } from "@/lib/seo/ogEntityFetch";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgShareCard } from "@/lib/seo/ogShareCard";

export const alt = "Сподели анкета — SmolyanVote";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MultipollOgImage({ params }: Props) {
  const { id } = await params;
  return renderOgShareCard(await fetchMultipollOg(id));
}
