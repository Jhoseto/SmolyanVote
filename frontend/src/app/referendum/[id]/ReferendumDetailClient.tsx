"use client";

import { EmptyState, ErrorState, LogoLoader, ShareButton } from "@/shared/ui";
import { DeleteEventButton, EditEventButton, EventDetailShell, useReferendumDetail } from "@/features/events";
import { ReferendumVoteWidget } from "@/features/voting";
import { CommentsSection } from "@/features/comments";
import { ReportButton } from "@/features/reports";
import { ApiError } from "@/lib/api/client";

export function ReferendumDetailClient({ id }: { id: number }) {
  const { data, isPending, isError, error, refetch } = useReferendumDetail(id);

  if (isPending) return <LogoLoader fullScreen size="lg" label="Зареждане на референдум…" />;

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState icon="bi-calendar-x" title="Референдумът не е намерен" description="Възможно е да е изтрит." />;
    }
    return <ErrorState description="Референдумът не можа да се зареди." onRetry={() => refetch()} />;
  }

  return (
    <EventDetailShell
      eventType={data.eventType}
      title={data.title}
      description={data.description}
      location={data.location}
      createdAt={data.createdAt}
      viewCounter={data.viewCounter}
      creatorName={data.creator.username}
      creatorImage={data.creator.imageUrl}
      images={data.imageUrls}
      voteSlot={
        <ReferendumVoteWidget
          referendumId={data.id}
          options={data.options}
          votes={data.votes}
          votePercentages={data.votePercentages}
          currentUserVote={data.currentUserVote}
          onVoted={() => refetch()}
        />
      }
      actionsSlot={
        <>
          <ShareButton title={data.title} />
          <ReportButton entityType="REFERENDUM" entityId={data.id} />
          <EditEventButton href={`/referendum/${data.id}/edit`} />
          <DeleteEventButton id={data.id} creatorUsername={data.creator.username} />
        </>
      }
      commentsSlot={<CommentsSection entityType="referendum" entityId={data.id} />}
    />
  );
}

