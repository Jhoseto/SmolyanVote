import Link from "next/link";

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function SeoBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-6 text-sm text-[color:var(--color-text-muted)]" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.name}-${i}`}>
          {i > 0 ? <span className="mx-2">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-primary">
              {item.name}
            </Link>
          ) : (
            <span className="text-[color:var(--color-text-secondary)]">{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
