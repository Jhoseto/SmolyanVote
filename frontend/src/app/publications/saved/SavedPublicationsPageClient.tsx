"use client";

import { SavedPublicationsPage } from "@/features/publications";
import { ReportButton } from "@/features/reports";
import { FollowButton } from "@/features/follow";
import { CommentsSection } from "@/features/comments";
import { useAuth } from "@/shared/lib/authContext";

export function SavedPublicationsPageClient() {
  const { user } = useAuth();

  return (
    <SavedPublicationsPage
      renderFollowSlot={(publication) =>
        publication.authorId && publication.authorId !== user?.id ? (
          <FollowButton userId={publication.authorId} />
        ) : null
      }
      renderReportSlot={(publication) => <ReportButton entityType="PUBLICATION" entityId={publication.id} />}
      renderCommentsSlot={(id) => <CommentsSection entityType="publication" entityId={id} />}
      renderAuthorFollowSlot={(authorId) => (authorId !== user?.id ? <FollowButton userId={authorId} /> : null)}
    />
  );
}
