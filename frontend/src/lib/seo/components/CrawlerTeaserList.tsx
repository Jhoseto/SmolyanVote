import Link from "next/link";

export interface CrawlerTeaserItem {
  href: string;
  title: string;
  description?: string | null;
}

/** sr-only link list for crawlers / AI — mirrors publications teaser pattern. */
export function CrawlerTeaserList({
  heading,
  items,
}: {
  heading: string;
  items: CrawlerTeaserItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="sr-only" aria-label={heading}>
      <h2>{heading}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.title}</Link>
            {item.description ? <p>{item.description.slice(0, 160)}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
