"use client";

import type { ReactNode } from "react";
import { SavedPublicationsPage, type Publication } from "@/features/publications";
import { ReportButton } from "@/features/reports";
import { FollowButton } from "@/features/follow";
import { CommentsSection } from "@/features/comments";
import { MessageUserButton } from "@/features/messenger";
import { UserHoverCard } from "@/features/profile";
import { useAuth } from "@/shared/lib/authContext";

export function SavedPublicationsPageClient() {
  const { user } = useAuth();

  function wrapAuthor(publication: Publication, children: ReactNode) {
    if (!publication.authorUsername) return children;
    const authorId = publication.authorId;
    return (
      <UserHoverCard
        username={publication.authorUsername}
        followSlot={
          authorId && authorId !== user?.id ? <FollowButton userId={authorId} /> : null
        }
        messageSlot={
          authorId && authorId !== user?.id ? (
            <MessageUserButton userId={authorId} className="w-full justify-center" />
          ) : null
        }
      >
        {children}
      </UserHoverCard>
    );
  }

  return (
    <SavedPublicationsPage
      renderFollowSlot={(publication) =>
        publication.authorId && publication.authorId !== user?.id ? (
          <FollowButton userId={publication.authorId} staticWhenFollowing />
        ) : null
      }
      renderReportSlot={(publication) => (
        <ReportButton entityType="PUBLICATION" entityId={publication.id} iconOnly />
      )}
      renderCommentsSlot={(id, totalComments) => (
        <CommentsSection
          entityType="publication"
          entityId={id}
          lazyCompose
          hideHeading
          totalCount={totalComments}
        />
      )}
      renderAuthorFollowSlot={(authorId) => (authorId !== user?.id ? <FollowButton userId={authorId} /> : null)}
      renderAuthorMessageSlot={(authorId) =>
        authorId !== user?.id ? <MessageUserButton userId={authorId} /> : null
      }
      wrapAuthor={wrapAuthor}
    />
  );
}
