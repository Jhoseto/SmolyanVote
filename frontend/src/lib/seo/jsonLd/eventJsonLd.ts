const SITE = "https://smolyanvote.com";

export interface EventJsonLdInput {
  id: number;
  kind: "event" | "referendum" | "multipoll";
  title: string;
  description: string;
  location?: string | null;
  createdAt: string;
  creatorUsername?: string | null;
  imageUrl?: string | null;
}

function eventPath(kind: EventJsonLdInput["kind"], id: number): string {
  if (kind === "referendum") return `/referendum/${id}`;
  if (kind === "multipoll") return `/multipoll/${id}`;
  return `/event/${id}`;
}

function kindLabel(kind: EventJsonLdInput["kind"]): string {
  if (kind === "referendum") return "Референдум";
  if (kind === "multipoll") return "Анкета";
  return "Гласуване";
}

export function buildEventJsonLd(input: EventJsonLdInput) {
  const path = eventPath(input.kind, input.id);
  const url = `${SITE}${path}`;
  const label = kindLabel(input.kind);

  const event = {
    "@type": "Event",
    "@id": `${url}#event`,
    name: input.title,
    description: input.description,
    startDate: input.createdAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    inLanguage: "bg-BG",
    url,
    image: input.imageUrl ?? undefined,
    location: {
      "@type": "Place",
      name: input.location?.trim() || "Смолян, България",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Смолян",
        addressRegion: "Област Смолян",
        addressCountry: "BG",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "SmolyanVote",
      url: SITE,
    },
    performer: input.creatorUsername
      ? {
          "@type": "Person",
          name: input.creatorUsername,
          url: `${SITE}/user/${encodeURIComponent(input.creatorUsername)}`,
        }
      : undefined,
    about: label,
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Начало", item: SITE },
      { "@type": "ListItem", position: 2, name: "Събития", item: `${SITE}/events` },
      { "@type": "ListItem", position: 3, name: input.title, item: url },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [event, breadcrumb] };
}
