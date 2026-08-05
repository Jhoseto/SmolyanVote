import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { AnswerFirstBlock } from "@/lib/seo/components/AnswerFirstBlock";
import { SeoBreadcrumbs } from "@/lib/seo/components/SeoBreadcrumbs";
import { buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { buildTopicHubJsonLd } from "@/lib/seo/jsonLd/topicJsonLd";
import { TOPIC_HUBS, getTopicHub } from "@/features/topics/data/topicHubs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOPIC_HUBS.map((hub) => ({ slug: hub.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const hub = getTopicHub(slug);
  if (!hub) {
    return buildSocialMetadata({ title: "Тема", path: `/topics/${slug}`, type: "website" });
  }
  return buildSocialMetadata({
    title: hub.title,
    description: hub.metaDescription,
    path: `/topics/${slug}`,
    type: "article",
  });
}

export default async function TopicHubPage({ params }: PageProps) {
  const { slug } = await params;
  const hub = getTopicHub(slug);
  if (!hub) notFound();

  return (
    <>
      <JsonLd
        data={buildTopicHubJsonLd({
          slug: hub.slug,
          title: hub.title,
          description: hub.metaDescription,
          faq: hub.faq,
        })}
      />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <SeoBreadcrumbs
          items={[{ name: "Начало", href: "/" }, { name: "Теми", href: "/topics" }, { name: hub.title }]}
        />
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-[color:var(--color-text-heading)]">
          {hub.title}
        </h1>
        <AnswerFirstBlock>{hub.answerFirst}</AnswerFirstBlock>
        <p className="mb-8 text-base leading-relaxed text-[color:var(--color-text-secondary)]">{hub.intro}</p>
        {hub.sections.map((section) => (
          <section key={section.heading} className="mb-8">
            <h2 className="mb-3 text-xl font-semibold text-[color:var(--color-text-heading)]">{section.heading}</h2>
            <p className="leading-relaxed text-[color:var(--color-text-secondary)]">{section.body}</p>
          </section>
        ))}
        {hub.faq.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Често задавани въпроси</h2>
            <dl className="space-y-4">
              {hub.faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-semibold text-[color:var(--color-text-heading)]">{item.question}</dt>
                  <dd className="mt-1 text-[color:var(--color-text-secondary)]">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        <nav className="border-t border-border-default/60 pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
            Свързани страници
          </h2>
          <ul className="flex flex-wrap gap-3">
            {hub.relatedLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-primary hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </>
  );
}
