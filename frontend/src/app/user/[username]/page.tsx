import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { buildPersonJsonLd } from "@/lib/seo/jsonLd/personJsonLd";
import { UserProfileClient } from "./UserProfileClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

function decodeUsername(raw: string): string {
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

async function fetchProfile(username: string) {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/users/${encodeURIComponent(username)}`), {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      username: string;
      realName?: string | null;
      bio?: string | null;
      imageUrl?: string | null;
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const username = decodeUsername((await params).username);
  const data = await fetchProfile(username);
  if (!data) {
    return buildSocialMetadata({
      title: "Профил",
      path: `/user/${encodeURIComponent(username)}`,
      type: "website",
    });
  }
  return buildSocialMetadata({
    title: data.realName || data.username,
    description: data.bio?.slice(0, 160) || `Профил на ${data.username} в SmolyanVote.`,
    path: `/user/${encodeURIComponent(username)}`,
    image: data.imageUrl,
    type: "website",
  });
}

export default async function UserProfilePage({ params }: PageProps) {
  const username = decodeUsername((await params).username);
  const data = await fetchProfile(username);

  return (
    <>
      {data ? (
        <JsonLd
          data={buildPersonJsonLd({
            username: data.username,
            bio: data.bio,
            imageUrl: data.imageUrl,
          })}
        />
      ) : null}
      <UserProfileClient username={username} />
    </>
  );
}
