"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import "./about-philosophy.css";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-primary-50 via-white to-primary-100/80" />,
});

interface AboutPhilosophyVideoProps {
  playbackId: string;
  videoTitle: string;
  className?: string;
  /** CSS object-position, e.g. "center 28%" or "center top". */
  objectPosition?: string;
  /** Scale media to crop baked-in letterbox/pillarbox. Default 1. */
  mediaZoom?: number;
}

/** 16:9 loop — mounts Mux only when near viewport; no player chrome. */
export function AboutPhilosophyVideo({
  playbackId,
  videoTitle,
  className,
  objectPosition = "center",
  mediaZoom = 1,
}: AboutPhilosophyVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rootStyle = {
    "--media-object-position": objectPosition,
  } as CSSProperties;

  const zoomStyle: CSSProperties | undefined =
    mediaZoom !== 1
      ? {
          transform: `scale(${mediaZoom})`,
          transformOrigin: objectPosition.includes("%") ? objectPosition : "center center",
        }
      : undefined;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-[20px] bg-[#0b1220]",
        "shadow-[0_20px_50px_-24px_rgba(25,134,28,0.45)] ring-1 ring-black/[0.08]",
        className,
      )}
      style={rootStyle}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
      {shouldLoad ? (
        <div className="absolute inset-0" style={zoomStyle}>
          <MuxPlayer
            playbackId={playbackId}
            metadataVideoTitle={videoTitle}
            autoPlay="muted"
            muted
            loop
            playsInline
            nohotkeys
            preload="metadata"
            streamType="on-demand"
            className="about-philosophy-video absolute inset-0 h-full w-full"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#14532d]/40 to-[#19861c]/25" />
      )}
    </div>
  );
}
