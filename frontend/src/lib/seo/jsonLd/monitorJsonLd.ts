const SITE = "https://smolyanvote.com";

export function buildMonitorContractJsonLd(input: {
  id: number;
  subject: string;
  shortSummary?: string | null;
  amountEur?: number | null;
  authorityName?: string | null;
  contractorName?: string | null;
  publishedAt?: string | null;
}) {
  const url = `${SITE}/monitor/contract/${input.id}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: input.subject,
        description: input.shortSummary ?? undefined,
        datePublished: input.publishedAt ?? undefined,
        inLanguage: "bg-BG",
        url,
        about: {
          "@type": "GovernmentService",
          name: "Общинска поръчка — Смолян",
          areaServed: "Смолян",
        },
        publisher: { "@type": "Organization", name: "SmolyanVote", url: SITE },
        mentions: [
          input.authorityName ? { "@type": "Organization", name: input.authorityName } : null,
          input.contractorName ? { "@type": "Organization", name: input.contractorName } : null,
        ].filter(Boolean),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Начало", item: SITE },
          { "@type": "ListItem", position: 2, name: "Монитор", item: `${SITE}/monitor` },
          { "@type": "ListItem", position: 3, name: input.subject, item: url },
        ],
      },
    ],
  };
}

export function buildMonitorDocumentJsonLd(input: {
  id: number;
  title: string;
  shortSummary?: string | null;
  documentType?: string | null;
  publishedAt?: string | null;
}) {
  const url = `${SITE}/monitor/document/${input.id}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: input.title,
        description: input.shortSummary ?? undefined,
        articleSection: input.documentType ?? "Документ",
        datePublished: input.publishedAt ?? undefined,
        inLanguage: "bg-BG",
        url,
        publisher: { "@type": "Organization", name: "SmolyanVote", url: SITE },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Начало", item: SITE },
          { "@type": "ListItem", position: 2, name: "Монитор", item: `${SITE}/monitor` },
          { "@type": "ListItem", position: 3, name: input.title, item: url },
        ],
      },
    ],
  };
}
