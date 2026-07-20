"use client";

import type { ReactNode } from "react";
import { Avatar } from "@/shared/ui";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { ProfileStatBadge } from "./ProfileStatBadge";
import type { PublicProfile } from "../types";

interface ProfileHeaderProps {
  profile: PublicProfile;
  onAvatarClick: () => void;
  /** "Редактирай профила" — only rendered for the owner. */
  editSlot?: ReactNode;
  /** "Следвай" — composed at the `app/` layer (features never import features); hidden for own profile. */
  followSlot?: ReactNode;
  reportSlot?: ReactNode;
  onShowConnections: (kind: "followers" | "following") => void;
}

/** Profile header (avatar, identity, bio, stats) — port of legacy `unified-profile.html` hero section. */
export function ProfileHeader({
  profile,
  onAvatarClick,
  editSlot,
  followSlot,
  reportSlot,
  onShowConnections,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-sm)] sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={onAvatarClick}
        aria-label="Виж профилната снимка"
        className="relative mx-auto shrink-0 sm:mx-0"
      >
        <Avatar username={profile.username} imageUrl={profile.imageUrl} size={104} />
        {profile.online && (
          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-[color:var(--color-success)]" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 text-center sm:text-left">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[color:var(--color-text-heading)]">
              {profile.realName || profile.username}
            </h1>
            <p className="text-sm text-[color:var(--color-text-muted)]">@{profile.username}</p>
          </div>

          <div className="mx-auto flex items-center gap-2 sm:mx-0">
            {editSlot}
            {followSlot}
            {reportSlot}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
          <span className="rounded-[var(--radius-pill)] bg-primary-50 px-2.5 py-1 font-medium text-primary">
            {profile.reputationBadge}
          </span>
          {profile.locationLabel && profile.locationLabel !== "-" && (
            <span className="flex items-center gap-1 text-[color:var(--color-text-muted)]">
              <i className="bi bi-geo-alt" />
              {profile.locationLabel}
            </span>
          )}
          <span className="flex items-center gap-1 text-[color:var(--color-text-muted)]">
            <i className="bi bi-calendar3" />
            Присъединил се {formatRelativeDate(profile.created)}
          </span>
        </div>

        {profile.bio && <p className="text-sm text-[color:var(--color-text-secondary)]">{profile.bio}</p>}

        <div className="flex flex-wrap justify-center gap-1 border-t border-border-default/60 pt-3 sm:justify-start">
          <ProfileStatBadge icon="bi-calendar-event" value={profile.eventsCount} label="Събития" />
          <ProfileStatBadge icon="bi-newspaper" value={profile.publicationsCount} label="Публикации" />
          <ProfileStatBadge icon="bi-geo-alt" value={profile.signalsCount} label="Сигнали" />
          <ProfileStatBadge
            icon="bi-people"
            value={profile.followersCount}
            label="Последователи"
            onClick={() => onShowConnections("followers")}
          />
          <ProfileStatBadge
            icon="bi-person-check"
            value={profile.followingCount}
            label="Следвани"
            onClick={() => onShowConnections("following")}
          />
        </div>
      </div>
    </div>
  );
}
