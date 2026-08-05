import Link from "next/link";
import { AnswerFirstBlock } from "@/lib/seo/components/AnswerFirstBlock";
import { SeoBreadcrumbs } from "@/lib/seo/components/SeoBreadcrumbs";
import { buildListingMetadata } from "@/lib/seo/buildSocialMetadata";
import { TOPIC_HUBS } from "@/features/topics/data/topicHubs";

export const metadata = buildListingMetadata({
  title: "Теми за Смолян и гражданско участие",
  description:
    "Ръководства и отговори по ключови теми: гражданско участие, сигнали, референдуми, монитор на общината и SmolyanVote.",
  path: "/topics",
});

export default function TopicsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <SeoBreadcrumbs items={[{ name: "Начало", href: "/" }, { name: "Теми" }]} />
      <h1 className="font-display text-3xl font-bold text-[color:var(--color-text-heading)]">
        Теми за Смолян
      </h1>
      <AnswerFirstBlock>
        SmolyanVote публикува тематични ръководства за гражданско участие, сигнали, гласувания и прозрачност в
        Смолян — оптимизирани за търсене и AI цитиране.
      </AnswerFirstBlock>
      <ul className="mt-8 space-y-4">
        {TOPIC_HUBS.map((hub) => (
          <li key={hub.slug} className="rounded-[var(--radius-md)] border border-border-default/60 p-4">
            <Link href={`/topics/${hub.slug}`} className="text-lg font-semibold text-primary hover:underline">
              {hub.title}
            </Link>
            <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{hub.metaDescription}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
