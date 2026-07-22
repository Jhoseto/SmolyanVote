"use client";

import { type ReactNode, useState } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { ErrorState, Skeleton } from "@/shared/ui";
import { useProfile } from "../hooks/useProfile";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileTabsNav } from "./ProfileTabsNav";
import { ProfileOverviewTab } from "./ProfileOverviewTab";
import { ProfileEventsTab } from "./ProfileEventsTab";
import { ProfilePublicationsTab } from "./ProfilePublicationsTab";
import { ProfileSignalsTab } from "./ProfileSignalsTab";
import { ConnectionsTab } from "./ConnectionsTab";
import { EditProfileModal } from "./EditProfileModal";
import { AvatarLightbox } from "./AvatarLightbox";
import type { ConnectionsKind, ProfileTab } from "../types";

const TAB_VALUES: ProfileTab[] = ["overview", "events", "publications", "signals", "connections"];

interface ProfilePageProps {
  username: string;
  /** "Следвай"/"Докладвай" — composed at the `app/` layer (features never import features). */
  renderFollowButton: (userId: number) => ReactNode;
  renderReportUserButton: (userId: number) => ReactNode;
  renderMessageButton?: (userId: number) => ReactNode;
}

/** Unified profile (own `/profile` + public `/user/{username}`) — MODERN_FRONTEND_PLAN.md Фаза 7. */
export function ProfilePage({
  username,
  renderFollowButton,
  renderReportUserButton,
  renderMessageButton,
}: ProfilePageProps) {
  const { data: profile, isPending, isError, refetch } = useProfile(username);
  const [tab, setTab] = useQueryState("tab", parseAsStringEnum<ProfileTab>(TAB_VALUES).withDefault("overview"));
  const [connectionsKind, setConnectionsKind] = useState<ConnectionsKind>("followers");
  const [editOpen, setEditOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  if (isPending) {
    return (
      <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-8">
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-12 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 py-8">
        <ErrorState description="Профилът не можа да се зареди." onRetry={() => refetch()} />
      </div>
    );
  }

  function showConnections(kind: ConnectionsKind) {
    setConnectionsKind(kind);
    void setTab("connections");
  }

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-8">
      <ProfileHeader
        profile={profile}
        onAvatarClick={() => setAvatarOpen(true)}
        onShowConnections={showConnections}
        editSlot={
          profile.isOwnProfile ? (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-text-secondary)] hover:bg-primary-50 hover:text-primary"
            >
              <i className="bi bi-pencil" />
              Редактирай профила
            </button>
          ) : undefined
        }
        messageSlot={
          !profile.isOwnProfile ? renderMessageButton?.(profile.id) : undefined
        }
        followSlot={!profile.isOwnProfile ? renderFollowButton(profile.id) : undefined}
        reportSlot={!profile.isOwnProfile ? renderReportUserButton(profile.id) : undefined}
      />

      <ProfileTabsNav active={tab} onChange={(next) => void setTab(next)} />

      {tab === "overview" && <ProfileOverviewTab profile={profile} />}
      {tab === "events" && <ProfileEventsTab username={username} />}
      {tab === "publications" && <ProfilePublicationsTab authorId={profile.id} />}
      {tab === "signals" && <ProfileSignalsTab username={username} />}
      {tab === "connections" && (
        <ConnectionsTab
          username={username}
          kind={connectionsKind}
          onKindChange={setConnectionsKind}
          followersCount={profile.followersCount}
          followingCount={profile.followingCount}
          followSlot={renderFollowButton}
          reportUserSlot={renderReportUserButton}
        />
      )}

      {profile.isOwnProfile && <EditProfileModal profile={profile} open={editOpen} onOpenChange={setEditOpen} />}

      <AvatarLightbox
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        imageUrl={profile.imageUrl}
        username={profile.username}
      />
    </div>
  );
}
