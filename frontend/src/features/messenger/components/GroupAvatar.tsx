"use client";

import Image from "next/image";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { MessengerUser } from "../types";

interface GroupAvatarProps {
  title: string;
  imageUrl?: string | null;
  members: MessengerUser[];
  size?: number;
  className?: string;
}

/**
 * A group photo when one is set, otherwise a two-up stack of member avatars —
 * the same trick Messenger uses so groups read differently from 1:1 chats.
 */
export function GroupAvatar({ title, imageUrl, members, size = 44, className }: GroupAvatarProps) {
  if (imageUrl) {
    return (
      <span
        className={cn("relative block shrink-0 overflow-hidden rounded-full", className)}
        style={{ width: size, height: size }}
      >
        <Image src={imageUrl} alt={title} fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }

  const [first, second] = members;
  const inner = Math.round(size * 0.62);

  if (!first) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        <i className="bi bi-people-fill" />
      </span>
    );
  }

  return (
    <span
      className={cn("relative block shrink-0", className)}
      style={{ width: size, height: size }}
      aria-label={title}
    >
      <span className="absolute left-0 top-0">
        <Avatar username={first.username} imageUrl={first.imageUrl} size={inner} />
      </span>
      <span className="absolute bottom-0 right-0 rounded-full ring-2 ring-white">
        {second ? (
          <Avatar username={second.username} imageUrl={second.imageUrl} size={inner} />
        ) : (
          <span
            className="flex items-center justify-center rounded-full bg-[color:var(--color-primary-50)] text-[color:var(--color-primary)]"
            style={{ width: inner, height: inner, fontSize: inner * 0.5 }}
          >
            <i className="bi bi-people-fill" />
          </span>
        )}
      </span>
    </span>
  );
}
