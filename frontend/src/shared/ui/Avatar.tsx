"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";

// Same palette/hash as v1 `avatarUtils.js` — keeps per-user colors consistent
// for users who saw the old UI (color is derived from username, not stored).
const COLORS = [
  "#4cb15c", "#2e8b57", "#228b22", "#32cd32", "#6b8e23",
  "#20b2aa", "#4682b4", "#9370db", "#ff6b6b", "#4ecdc4",
  "#45b7d1", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c",
  "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad",
];

const DEFAULT_AVATAR_MARKERS = [
  "/default-avatar.jpg",
  "/default-avatar.png",
  "/images/default-avatar.png",
  "/images/default-avatar.jpg",
  "default-avatar",
];

function getInitials(username: string): string {
  const clean = username.trim();
  if (!clean) return "U";

  const words = clean.split(" ").filter((w) => w.length > 0);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  const word = words[0] ?? clean;
  return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.charAt(0).toUpperCase();
}

function getAvatarColor(username: string): string {
  const clean = username.trim();
  if (!clean) return COLORS[0];

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function isValidImageUrl(imageUrl?: string | null): boolean {
  if (!imageUrl) return false;
  const trimmed = imageUrl.trim();
  if (!trimmed) return false;
  return !DEFAULT_AVATAR_MARKERS.some((marker) => trimmed.includes(marker));
}

/** Retina delivery for Cloudinary — no g_auto (requires a paid addon; 404s without it). */
function deliveryUrl(imageUrl: string, size: number): string {
  if (!imageUrl.includes("res.cloudinary.com") || !imageUrl.includes("/upload/")) {
    return imageUrl;
  }
  if (/\/upload\/[^/]+,/.test(imageUrl)) {
    return imageUrl;
  }
  const px = Math.max(96, Math.round(size * 2));
  return imageUrl.replace(
    "/upload/",
    `/upload/c_fill,g_face,w_${px},h_${px},f_auto,q_auto:best/`,
  );
}

interface AvatarProps {
  username: string;
  imageUrl?: string | null;
  /** px — controls both the `<img>`/placeholder box and initials font-size. */
  size?: number;
  className?: string;
}

/**
 * React port of v1 `avatarUtils.js` (image with initials-fallback).
 * No `setInterval`/`MutationObserver` re-scan — React state handles the
 * broken-image → initials transition declaratively, exactly once per mount.
 */
export function Avatar({ username, imageUrl, size = 40, className }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const initials = useMemo(() => getInitials(username), [username]);
  const color = useMemo(() => getAvatarColor(username), [username]);
  const showImage = !imageFailed && isValidImageUrl(imageUrl);

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-supplied remote URLs, not optimizable statically
      <img
        src={deliveryUrl(imageUrl ?? "", size)}
        alt={username}
        onError={() => setImageFailed(true)}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
        decoding="async"
      />
    );
  }

  return (
    <div
      aria-label={username}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        className,
      )}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
