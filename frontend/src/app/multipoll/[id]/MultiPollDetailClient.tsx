"use client";

import { EmptyState, ErrorState, LogoLoader, ShareButton } from "@/shared/ui";
import { DeleteEventButton, EditEventButton, EventDetailShell, useMultiPollDetail } from "@/features/events";
import { MultiPollVoteWidget } from "@/features/voting";
import { CommentsSection } from "@/features/comments";
import { ReportButton } from "@/features/reports";
import { ApiError } from "@/lib/api/client";

export function MultiPollDetailClient({ id }: { id: number }) {
  const { data, isPending, isError, error, refetch } = useMultiPollDetail(id);

  if (isPending) return <LogoLoader fullScreen size="lg" label="Зареждане на анкета…" />;

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState icon="bi-calendar-x" title="Анкетата не е намерена" description="Възможно е да е изтрита." />;
    }
    return <ErrorState description="Анкетата не можа да се зареди." onRetry={() => refetch()} />;
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
        <MultiPollVoteWidget
          pollId={data.id}
          optionsText={data.optionsText}
          votesForOptions={data.votesForOptions}
          votePercentages={data.votePercentages}
          currentUserVotes={data.currentUserVotes}
          onVoted={() => refetch()}
        />
      }
      actionsSlot={
        <>
          <ShareButton title={data.title} />
          <ReportButton entityType="MULTI_POLL" entityId={data.id} />
          <EditEventButton href={`/multipoll/${data.id}/edit`} />
          <DeleteEventButton id={data.id} creatorUsername={data.creator.username} />
        </>
      }
      commentsSlot={<CommentsSection entityType="multiPoll" entityId={data.id} />}
    />
  );
}

