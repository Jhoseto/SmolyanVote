const SITE = "https://smolyanvote.com";

export interface PublicationJsonLdInput {
  id: number;
  title: string;
  content: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  authorUsername?: string | null;
  authorId?: number | null;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  category?: string | null;
}

/** JSON-LD graph for a publication article (SEO + GEO/AIO). */
export function buildPublicationJsonLd(input: PublicationJsonLdInput) {
  const url = `${SITE}/publications/${input.id}`;
  const description = (input.excerpt || input.content || "").trim().slice(0, 300);
  const authorName = input.authorUsername?.trim() || "SmolyanVote потребител";

  const article = {
    "@type": "SocialMediaPosting",
    "@id": `${url}#article`,
    headline: input.title,
    articleBody: input.content,
    description,
    datePublished: input.createdAt,
    dateModified: input.updatedAt || input.createdAt,
    inLanguage: "bg-BG",
    mainEntityOfPage: url,
    url,
    image: input.imageUrl ? [input.imageUrl] : undefined,
    author: {
      "@type": "Person",
      name: authorName,
      url: input.authorUsername ? `${SITE}/user/${encodeURIComponent(input.authorUsername)}` : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "SmolyanVote",
      url: SITE,
      logo: `${SITE}/images/logoNew.png`,
    },
    contentLocation: {
      "@type": "Place",
      name: "Смолян",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Смолян",
        addressRegion: "Област Смолян",
        addressCountry: "BG",
      },
    },
    articleSection: input.category ?? undefined,
    interactionStatistic: [
      input.likesCount != null
        ? {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/LikeAction",
            userInteractionCount: input.likesCount,
          }
        : null,
      input.commentsCount != null
        ? {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/CommentAction",
            userInteractionCount: input.commentsCount,
          }
        : null,
      input.sharesCount != null
        ? {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/ShareAction",
            userInteractionCount: input.sharesCount,
          }
        : null,
    ].filter(Boolean),
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Начало", item: SITE },
      { "@type": "ListItem", position: 2, name: "Публикации", item: `${SITE}/publications` },
      { "@type": "ListItem", position: 3, name: input.title, item: url },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [article, breadcrumb],
  };
}
