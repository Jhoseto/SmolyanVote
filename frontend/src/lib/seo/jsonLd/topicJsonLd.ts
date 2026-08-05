const SITE = "https://smolyanvote.com";

export interface TopicHubJsonLdInput {
  slug: string;
  title: string;
  description: string;
  faq?: Array<{ question: string; answer: string }>;
}

export function buildTopicHubJsonLd(input: TopicHubJsonLdInput) {
  const url = `${SITE}/topics/${input.slug}`;
  const article = {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: input.title,
    description: input.description,
    inLanguage: "bg-BG",
    url,
    author: { "@type": "Organization", name: "SmolyanVote", url: SITE },
    publisher: { "@type": "Organization", name: "SmolyanVote", url: SITE },
    about: {
      "@type": "Place",
      name: "Смолян",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Смолян",
        addressRegion: "Област Смолян",
        addressCountry: "BG",
      },
    },
  };

  const faq =
    input.faq && input.faq.length > 0
      ? {
          "@type": "FAQPage",
          mainEntity: input.faq.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: { "@type": "Answer", text: q.answer },
          })),
        }
      : null;

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Начало", item: SITE },
      { "@type": "ListItem", position: 2, name: "Теми", item: `${SITE}/topics` },
      { "@type": "ListItem", position: 3, name: input.title, item: url },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [article, breadcrumb, ...(faq ? [faq] : [])],
  };
}
