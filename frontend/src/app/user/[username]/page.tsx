import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const username = decodeUsername((await params).username);
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/users/${encodeURIComponent(username)}`));
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    return {
      title: `SmolyanVote - ${data.realName || data.username}`,
      description: data.bio?.slice(0, 160) || `Профил на ${data.username} в SmolyanVote.`,
      alternates: { canonical: `/user/${encodeURIComponent(username)}` },
    };
  } catch {
    return { title: "SmolyanVote - Профил" };
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const username = decodeUsername((await params).username);
  return <UserProfileClient username={username} />;
}
