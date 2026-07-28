"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/shared/lib/cn";

interface LinkMetadata {
  type?: "youtube" | "image" | "website";
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  videoId?: string;
  embedUrl?: string;
}

const YOUTUBE_ID = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]+)/;

function embedUrlFor(metadata: LinkMetadata): string | null {
  if (metadata.type !== "youtube") return null;
  if (metadata.embedUrl) return metadata.embedUrl;
  if (metadata.videoId) return `https://www.youtube.com/embed/${metadata.videoId}`;
  const match = metadata.url.match(YOUTUBE_ID);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

/** Compact preview for external links, with inline YouTube playback. */
export function ChatLinkPreview({ url, isOwn }: { url: string; isOwn: boolean }) {
  const [playing, setPlaying] = useState(false);

  const { data } = useQuery({
    queryKey: ["messenger", "link-preview", url],
    queryFn: async () => {
      const res = await apiClient.get<{ url: string; metadata: string | null }>(
        `/api/v1/publications/link-preview?url=${encodeURIComponent(url)}`,
      );
      if (!res.metadata) return null;
      try {
        const parsed = JSON.parse(res.metadata) as Partial<LinkMetadata>;
        return parsed?.url ? ({ type: "website", ...parsed } as LinkMetadata) : null;
      } catch {
        return null;
      }
    },
    staleTime: 30 * 60_000,
    retry: false,
  });

  if (!data) return null;
  const embed = embedUrlFor(data);

  if (embed && playing) {
    return (
      <div className="mt-1.5 w-[260px] overflow-hidden rounded-[var(--radius-md)]">
        <iframe
          src={`${embed}?autoplay=1`}
          title={data.title ?? "YouTube"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full border-0"
        />
      </div>
    );
  }

  const Wrapper = embed ? "button" : "a";
  const wrapperProps = embed
    ? { type: "button" as const, onClick: () => setPlaying(true) }
    : { href: data.url, target: "_blank", rel: "noopener noreferrer" };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "mt-1.5 block w-[260px] overflow-hidden rounded-[var(--radius-md)] text-left transition-shadow hover:shadow-[var(--shadow-sm)]",
        isOwn ? "bg-white/15 ring-1 ring-white/25" : "bg-white ring-1 ring-border-default/60",
      )}
    >
      {data.image && (
        <span className="relative block h-[110px] w-full">
          <Image src={data.image} alt="" fill unoptimized className="object-cover" />
          {embed && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <i className="bi bi-play-circle-fill text-3xl text-white" />
            </span>
          )}
        </span>
      )}
      <span className="block p-2.5">
        {data.siteName && (
          <span className={cn("sv-msg-label text-[10px]", isOwn ? "text-white/75" : "text-[color:var(--color-text-muted)]")}>
            {data.siteName}
          </span>
        )}
        {data.title && (
          <span className="mt-0.5 block text-[12px] font-semibold leading-snug line-clamp-2">
            {data.title}
          </span>
        )}
        {data.description && (
          <span
            className={cn(
              "mt-0.5 block text-[11px] leading-snug line-clamp-2",
              isOwn ? "text-white/75" : "text-[color:var(--color-text-muted)]",
            )}
          >
            {data.description}
          </span>
        )}
      </span>
    </Wrapper>
  );
}

const EXTERNAL_URL = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/;

/** First external URL in a message, or null when it is internal / absent. */
export function findExternalUrl(text: string): string | null {
  const match = text.match(EXTERNAL_URL);
  if (!match) return null;
  try {
    const parsed = new URL(match[0]);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host.endsWith("smolyanvote.com") || host === "localhost") return null;
    return match[0];
  } catch {
    return null;
  }
}
