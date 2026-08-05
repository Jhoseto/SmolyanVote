const SITE = "https://smolyanvote.com";

export interface SignalJsonLdInput {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  modifiedAt?: string | null;
  authorUsername?: string | null;
  categoryLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
}

export function buildSignalJsonLd(input: SignalJsonLdInput) {
  const url = `${SITE}/signals/${input.id}`;
  const report = {
    "@type": "Report",
    "@id": `${url}#report`,
    name: input.title,
    description: input.description,
    datePublished: input.createdAt,
    dateModified: input.modifiedAt || input.createdAt,
    inLanguage: "bg-BG",
    url,
    author: input.authorUsername
      ? {
          "@type": "Person",
          name: input.authorUsername,
          url: `${SITE}/user/${encodeURIComponent(input.authorUsername)}`,
        }
      : { "@type": "Organization", name: "SmolyanVote" },
    publisher: {
      "@type": "Organization",
      name: "SmolyanVote",
      url: SITE,
    },
    image: input.imageUrl ?? undefined,
    about: input.categoryLabel ?? "Граждански сигнал",
    contentLocation:
      input.latitude != null && input.longitude != null
        ? {
            "@type": "Place",
            name: "Смолян",
            geo: {
              "@type": "GeoCoordinates",
              latitude: input.latitude,
              longitude: input.longitude,
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Смолян",
              addressRegion: "Област Смолян",
              addressCountry: "BG",
            },
          }
        : {
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

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Начало", item: SITE },
      { "@type": "ListItem", position: 2, name: "Сигнали", item: `${SITE}/signals` },
      { "@type": "ListItem", position: 3, name: input.title, item: url },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [report, breadcrumb] };
}
