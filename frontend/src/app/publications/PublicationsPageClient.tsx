"use client";

import { PublicationsFeedPage } from "@/features/publications";
import { ReportButton } from "@/features/reports";
import { FollowButton } from "@/features/follow";
import { CommentsSection } from "@/features/comments";
import { MessageUserButton } from "@/features/messenger";
import { useAuth } from "@/shared/lib/authContext";

/** Composes cross-feature per-card/modal actions (features never import features — MODERN_FRONTEND_PLAN §Frontend architecture rules). */
export function PublicationsPageClient() {
  const { user } = useAuth();

  return (
    <PublicationsFeedPage
      renderFollowSlot={(publication) =>
        publication.authorId && publication.authorId !== user?.id ? (
          <FollowButton userId={publication.authorId} />
        ) : null
      }
      renderReportSlot={(publication) => <ReportButton entityType="PUBLICATION" entityId={publication.id} />}
      renderCommentsSlot={(id) => <CommentsSection entityType="publication" entityId={id} />}
      renderAuthorFollowSlot={(authorId) => (authorId !== user?.id ? <FollowButton userId={authorId} /> : null)}
      renderAuthorMessageSlot={(authorId) =>
        authorId !== user?.id ? <MessageUserButton userId={authorId} /> : null
      }
    />
  );
}
