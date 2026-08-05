const SITE = "https://smolyanvote.com";

export interface PersonJsonLdInput {
  username: string;
  bio?: string | null;
  imageUrl?: string | null;
}

export function buildPersonJsonLd(input: PersonJsonLdInput) {
  const url = `${SITE}/user/${encodeURIComponent(input.username)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profile`,
        url,
        mainEntity: {
          "@type": "Person",
          name: input.username,
          description: input.bio ?? undefined,
          image: input.imageUrl ?? undefined,
          url,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Начало", item: SITE },
          { "@type": "ListItem", position: 2, name: input.username, item: url },
        ],
      },
    ],
  };
}
