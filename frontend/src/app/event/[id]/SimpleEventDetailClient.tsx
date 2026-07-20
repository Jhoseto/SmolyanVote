"use client";

import { EmptyState, ErrorState, LogoLoader, ShareButton } from "@/shared/ui";
import { DeleteEventButton, EditEventButton, EventDetailShell, useSimpleEventDetail } from "@/features/events";
import { SimpleEventVoteWidget } from "@/features/voting";
import { CommentsSection } from "@/features/comments";
import { ReportButton } from "@/features/reports";
import { ApiError } from "@/lib/api/client";

export function SimpleEventDetailClient({ id }: { id: number }) {
  const { data, isPending, isError, error, refetch } = useSimpleEventDetail(id);

  if (isPending) return <LogoLoader fullScreen size="lg" label="Зареждане на събитие…" />;

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState icon="bi-calendar-x" title="Събитието не е намерено" description="Възможно е да е изтрито." />;
    }
    return <ErrorState description="Събитието не можа да се зареди." onRetry={() => refetch()} />;
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
      images={data.images}
      voteSlot={
        <SimpleEventVoteWidget
          eventId={data.id}
          currentUserVote={data.currentUserVote}
          yesVotes={data.yesVotes}
          noVotes={data.noVotes}
          neutralVotes={data.neutralVotes}
          yesPercent={data.yesPercent}
          noPercent={data.noPercent}
          neutralPercent={data.neutralPercent}
          positiveLabel={data.positiveLabel}
          negativeLabel={data.negativeLabel}
          neutralLabel={data.neutralLabel}
          onVoted={() => refetch()}
        />
      }
      actionsSlot={
        <>
          <ShareButton title={data.title} />
          <ReportButton entityType="SIMPLE_EVENT" entityId={data.id} />
          <EditEventButton href={`/event/${data.id}/edit`} />
          <DeleteEventButton id={data.id} creatorUsername={data.creator.username} />
        </>
      }
      commentsSlot={<CommentsSection entityType="simpleEvent" entityId={data.id} />}
    />
  );
}

