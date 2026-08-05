const SITE = "https://smolyanvote.com";

export interface BreadcrumbInput {
  name: string;
  href?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbInput[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href ? (item.href.startsWith("http") ? item.href : `${SITE}${item.href}`) : undefined,
    })),
  };
}
