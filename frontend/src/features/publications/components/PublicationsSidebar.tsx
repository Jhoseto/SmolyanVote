"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Avatar, Card, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import {
  useCityEventsTeaser,
  useCitySignalsTeaser,
  useFromAdmin,
  useMostCommented,
  usePublicationsSidebarStats,
  useTopAuthors,
  useTopViewed,
  useTrendingTopics,
} from "../hooks/usePublicationsSidebar";
import type { PublicationStatSummary } from "../types";

interface PublicationsSidebarProps {
  onOpenPost: (id: number) => void;
  onTrendingClick: (topic: string) => void;
  renderAuthorFollowSlot?: (authorId: number) => ReactNode;
  renderAuthorMessageSlot?: (authorId: number) => ReactNode;
}

function WidgetCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-heading)]">
        <i className={cn("bi", icon, "text-primary")} />
        {title}
      </h3>
      {children}
    </Card>
  );
}

function StatsWidget() {
  const { data, isPending } = usePublicationsSidebarStats();
  if (isPending) return <Skeleton className="h-20 w-full" />;
  if (!data) return null;

  const rows = [
    { label: "Публикации", value: data.totalPublications },
    { label: "Днес", value: data.todayPublications },
    { label: "Тази седмица", value: data.weekPublications },
    { label: "Онлайн", value: data.onlineUsers },
  ];

  return (
    <WidgetCard title="Статистика" icon="bi-bar-chart-fill">
      <dl className="grid grid-cols-2 gap-3 text-center">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-[color:var(--color-text-muted)]">{row.label}</dt>
            <dd className="text-lg font-bold text-[color:var(--color-text-heading)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </WidgetCard>
  );
}

function PeopleSuggestionsWidget({
  renderAuthorFollowSlot,
  renderAuthorMessageSlot,
}: {
  renderAuthorFollowSlot?: (authorId: number) => ReactNode;
  renderAuthorMessageSlot?: (authorId: number) => ReactNode;
}) {
  const { data, isPending } = useTopAuthors();
  if (isPending) return <Skeleton className="h-40 w-full" />;
  if (!data || data.authors.length === 0) return null;

  const suggestions = data.authors.filter((a) => !a.isFollowing);
  const authors = suggestions.length > 0 ? suggestions : data.authors;

  return (
    <WidgetCard
      title={suggestions.length > 0 ? "Може да познаваш" : "Активни автори"}
      icon="bi-person-plus-fill"
    >
      <ul className="flex flex-col gap-2.5">
        {authors.map((author) => (
          <li key={author.id} className="flex items-center gap-2.5">
            <Link href={`/user/${encodeURIComponent(author.username)}`}>
              <Avatar username={author.username} imageUrl={author.imageUrl} size={32} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/user/${encodeURIComponent(author.username)}`}
                className="truncate text-sm font-medium text-[color:var(--color-text-primary)] hover:text-primary"
              >
                {author.username}
              </Link>
              <p className="text-xs text-[color:var(--color-text-muted)]">
                {author.publicationsCount}{" "}
                {author.publicationsCount === 1 ? "публикация" : "публикации"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {renderAuthorMessageSlot?.(author.id)}
              {renderAuthorFollowSlot?.(author.id)}
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

function TrendingWidget({ onTrendingClick }: { onTrendingClick: (topic: string) => void }) {
  const { data, isPending } = useTrendingTopics();
  if (isPending) return <Skeleton className="h-24 w-full" />;
  if (!data || data.length === 0) return null;

  return (
    <WidgetCard title="Популярни теми" icon="bi-hash">
      <div className="flex flex-wrap gap-1.5">
        {data.map((topic) => (
          <button
            key={topic.topic}
            type="button"
            onClick={() => onTrendingClick(topic.topic)}
            className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-2.5 py-1 text-xs font-medium text-[color:var(--color-text-secondary)] hover:bg-primary-50 hover:text-primary"
          >
            #{topic.topic}
            <span className="text-[color:var(--color-text-muted)]">{topic.count}</span>
          </button>
        ))}
      </div>
    </WidgetCard>
  );
}

function CoverThumb({ post }: { post: PublicationStatSummary }) {
  if (post.imageUrl) {
    return (
      <img
        src={post.imageUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-[var(--radius-md)] object-cover"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]">
      <i className="bi bi-image text-lg" />
    </div>
  );
}

function TopViewedWidget({ onOpenPost }: { onOpenPost: (id: number) => void }) {
  const { data, isPending } = useTopViewed();
  if (isPending) return <Skeleton className="h-40 w-full" />;
  const posts = (data ?? []).filter((p) => p.id != null);
  if (posts.length === 0) return null;

  return (
    <WidgetCard title="Най-гледани" icon="bi-eye-fill">
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => onOpenPost(post.id!)}
              className="flex w-full items-start gap-2.5 text-left"
            >
              <CoverThumb post={post} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-[color:var(--color-text-primary)] hover:text-primary">
                  {post.title}
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {post.authorName} · <i className="bi bi-eye" /> {post.viewsCount}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

function MostCommentedWidget({ onOpenPost }: { onOpenPost: (id: number) => void }) {
  const { data, isPending } = useMostCommented();
  if (isPending) return <Skeleton className="h-36 w-full" />;
  const posts = (data ?? []).filter((p) => p.id != null);
  if (posts.length === 0) return null;

  return (
    <WidgetCard title="Най-коментирани" icon="bi-chat-dots-fill">
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => onOpenPost(post.id!)}
              className="flex w-full items-start gap-2.5 text-left"
            >
              <CoverThumb post={post} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-[color:var(--color-text-primary)] hover:text-primary">
                  {post.title}
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {post.authorName} · <i className="bi bi-chat" /> {post.commentsCount}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

function FromAdminWidget({ onOpenPost }: { onOpenPost: (id: number) => void }) {
  const { data, isPending } = useFromAdmin();
  if (isPending) return <Skeleton className="h-28 w-full" />;
  if (!data?.id) return null;

  return (
    <WidgetCard title="От администратора" icon="bi-shield-fill-check">
      <button
        type="button"
        onClick={() => onOpenPost(data.id!)}
        className="flex w-full items-start gap-2.5 text-left"
      >
        <CoverThumb post={data} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-[color:var(--color-text-primary)] hover:text-primary">
            {data.title}
          </p>
          <p className="text-xs text-[color:var(--color-text-muted)]">
            {data.authorName}
            {data.viewsCount > 0 && (
              <>
                {" "}
                · <i className="bi bi-eye" /> {data.viewsCount}
              </>
            )}
          </p>
        </div>
      </button>
    </WidgetCard>
  );
}

function CityLifeWidget() {
  const events = useCityEventsTeaser();
  const signals = useCitySignalsTeaser();

  if (events.isPending && signals.isPending) return <Skeleton className="h-36 w-full" />;

  const eventRows = events.data ?? [];
  const signalRows = signals.data ?? [];
  if (eventRows.length === 0 && signalRows.length === 0) return null;

  const eventHref = (type: string, id: number) => {
    if (type === "REFERENDUM") return `/referendum/${id}`;
    if (type === "MULTI_POLL") return `/multipoll/${id}`;
    return `/event/${id}`;
  };

  return (
    <WidgetCard title="Градски живот" icon="bi-geo-alt-fill">
      <div className="flex flex-col gap-3">
        {eventRows.map((e) => (
          <Link
            key={`e-${e.id}`}
            href={eventHref(e.eventType, e.id)}
            className="block rounded-[var(--radius-md)] hover:bg-primary-50/60"
          >
            <p className="line-clamp-2 text-sm font-medium text-[color:var(--color-text-primary)]">{e.title}</p>
            <p className="text-xs text-[color:var(--color-text-muted)]">
              <i className="bi bi-calendar-event" /> {e.creatorName}
            </p>
          </Link>
        ))}
        {signalRows.map((s) => (
          <Link
            key={`s-${s.id}`}
            href={`/signals?openSignal=${s.id}`}
            className="block rounded-[var(--radius-md)] hover:bg-primary-50/60"
          >
            <p className="line-clamp-2 text-sm font-medium text-[color:var(--color-text-primary)]">{s.title}</p>
            <p className="text-xs text-[color:var(--color-text-muted)]">
              <i className="bi bi-exclamation-triangle" /> {s.categoryLabel}
            </p>
          </Link>
        ))}
        <div className="flex gap-3 border-t border-border-default/40 pt-2 text-xs font-medium">
          <Link href="/events" className="text-primary hover:underline">
            Събития
          </Link>
          <Link href="/signals" className="text-primary hover:underline">
            Сигнали
          </Link>
        </div>
      </div>
    </WidgetCard>
  );
}

/** Дясна лента — discovery + градски живот (без дублиращия блок „Общност“). */
export function PublicationsSidebar({
  onOpenPost,
  onTrendingClick,
  renderAuthorFollowSlot,
  renderAuthorMessageSlot,
}: PublicationsSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      <StatsWidget />
      <PeopleSuggestionsWidget
        renderAuthorFollowSlot={renderAuthorFollowSlot}
        renderAuthorMessageSlot={renderAuthorMessageSlot}
      />
      <TopViewedWidget onOpenPost={onOpenPost} />
      <MostCommentedWidget onOpenPost={onOpenPost} />
      <FromAdminWidget onOpenPost={onOpenPost} />
      <CityLifeWidget />
      <TrendingWidget onTrendingClick={onTrendingClick} />
    </div>
  );
}
