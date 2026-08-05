const SITE = "https://smolyanvote.com";

export interface PodcastEpisodeInput {
  id: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  publishedAt?: string | null;
  durationSeconds?: number | null;
}

export function buildPodcastSeriesJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: "SmolyanVote Studio",
    description: "Подкаст за гражданско участие, местни теми и общността в Смолян.",
    url: `${SITE}/podcast`,
    inLanguage: "bg-BG",
    publisher: {
      "@type": "Organization",
      name: "SmolyanVote",
      url: SITE,
    },
  };
}

export function buildPodcastEpisodeJsonLd(input: PodcastEpisodeInput) {
  const url = `${SITE}/podcast/episode/${input.id}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "PodcastEpisode",
        "@id": `${url}#episode`,
        name: input.title,
        description: input.description ?? undefined,
        url,
        datePublished: input.publishedAt ?? undefined,
        inLanguage: "bg-BG",
        image: input.imageUrl ?? undefined,
        partOfSeries: {
          "@type": "PodcastSeries",
          name: "SmolyanVote Studio",
          url: `${SITE}/podcast`,
        },
        associatedMedia: input.audioUrl
          ? {
              "@type": "AudioObject",
              contentUrl: input.audioUrl,
              encodingFormat: "audio/mpeg",
              duration: input.durationSeconds
                ? `PT${Math.floor(input.durationSeconds / 60)}M${input.durationSeconds % 60}S`
                : undefined,
            }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Начало", item: SITE },
          { "@type": "ListItem", position: 2, name: "Подкаст", item: `${SITE}/podcast` },
          { "@type": "ListItem", position: 3, name: input.title, item: url },
        ],
      },
    ],
  };
}
