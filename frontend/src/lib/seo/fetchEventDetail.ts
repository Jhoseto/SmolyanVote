import { resolveApiUrl } from "@/config/env";
import type { EventJsonLdInput } from "@/lib/seo/jsonLd/eventJsonLd";

export interface EventDetailSeo {
  id: number;
  kind: EventJsonLdInput["kind"];
  title: string;
  description: string;
  location?: string | null;
  createdAt: string;
  creatorUsername?: string | null;
  imageUrl?: string | null;
  viewCounter?: number;
  totalVotes?: number;
}

export async function fetchSimpleEventDetail(id: string): Promise<EventDetailSeo | null> {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/events/simple/${id}`), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      kind: "event",
      title: data.title,
      description: data.description,
      location: data.location,
      createdAt: data.createdAt,
      creatorUsername: data.creator?.username,
      imageUrl: data.images?.[0] ?? null,
      viewCounter: data.viewCounter,
      totalVotes: data.totalVotes,
    };
  } catch {
    return null;
  }
}

export async function fetchReferendumDetail(id: string): Promise<EventDetailSeo | null> {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/events/referendum/${id}`), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      kind: "referendum",
      title: data.title,
      description: data.description,
      location: data.location,
      createdAt: data.createdAt,
      creatorUsername: data.creator?.username,
      imageUrl: data.images?.[0] ?? null,
      viewCounter: data.viewCounter,
      totalVotes: data.totalVotes,
    };
  } catch {
    return null;
  }
}

export async function fetchMultipollDetail(id: string): Promise<EventDetailSeo | null> {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/events/multipoll/${id}`), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      kind: "multipoll",
      title: data.title,
      description: data.description,
      location: data.location,
      createdAt: data.createdAt,
      creatorUsername: data.creator?.username,
      imageUrl: data.images?.[0] ?? null,
      viewCounter: data.viewCounter,
      totalVotes: data.totalVotes,
    };
  } catch {
    return null;
  }
}
