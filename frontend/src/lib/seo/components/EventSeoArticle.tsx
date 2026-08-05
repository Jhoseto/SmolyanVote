import Link from "next/link";
import type { EventDetailSeo } from "@/lib/seo/fetchEventDetail";
import { SeoBreadcrumbs } from "@/lib/seo/components/SeoBreadcrumbs";

const KIND_LABEL: Record<EventDetailSeo["kind"], string> = {
  event: "Гласуване",
  referendum: "Референдум",
  multipoll: "Анкета",
};

export function EventSeoArticle({ data }: { data: EventDetailSeo }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <SeoBreadcrumbs
        items={[
          { name: "Начало", href: "/" },
          { name: "Събития", href: "/events" },
          { name: data.title },
        ]}
      />
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{KIND_LABEL[data.kind]}</p>
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-[color:var(--color-text-heading)]">
          {data.title}
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
          {data.creatorUsername ? (
            <>
              От{" "}
              <Link href={`/user/${encodeURIComponent(data.creatorUsername)}`} className="font-semibold text-primary hover:underline">
                {data.creatorUsername}
              </Link>
            </>
          ) : (
            "SmolyanVote"
          )}
          {data.location ? ` · ${data.location}` : " · Смолян"}
          {" · "}
          <time dateTime={data.createdAt}>
            {new Date(data.createdAt).toLocaleDateString("bg-BG", { year: "numeric", month: "long", day: "numeric" })}
          </time>
        </p>
        {(data.totalVotes != null || data.viewCounter != null) && (
          <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
            {data.totalVotes ?? 0} гласа · {data.viewCounter ?? 0} прегледа
          </p>
        )}
      </header>
      {data.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.imageUrl} alt={data.title} className="mb-6 max-h-[480px] w-full rounded-[var(--radius-lg)] object-cover" />
      ) : null}
      <div className="whitespace-pre-line text-base leading-relaxed text-[color:var(--color-text-secondary)]">
        {data.description}
      </div>
      <footer className="mt-10 border-t border-border-default/60 pt-6 text-sm">
        <Link href="/events" className="font-semibold text-primary hover:underline">
          ← Всички събития
        </Link>
      </footer>
    </article>
  );
}
