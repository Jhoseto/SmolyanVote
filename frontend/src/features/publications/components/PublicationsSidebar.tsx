"use client";

import type { ReactNode } from "react";
import { Avatar, Card, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import {
  useLastActivity,
  useMostCommentedToday,
  usePublicationsSidebarStats,
  useTopAuthors,
  useTopViewedToday,
  useTrendingTopics,
} from "../hooks/usePublicationsSidebar";
import type { PublicationStatSummary } from "../types";

interface PublicationsSidebarProps {
  onOpenPost: (id: number) => void;
  onTrendingClick: (topic: string) => void;
  /** "Следвай" за всеки автор — композиран от `app/` (features не импортират features). */
  renderAuthorFollowSlot?: (authorId: number) => ReactNode;
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
    { label: "Онлайн потребители", value: data.onlineUsers },
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

function TopAuthorsWidget({ renderAuthorFollowSlot }: { renderAuthorFollowSlot?: (authorId: number) => ReactNode }) {
  const { data, isPending } = useTopAuthors();
  if (isPending) return <Skeleton className="h-40 w-full" />;
  if (!data || data.authors.length === 0) return null;

  return (
    <WidgetCard title="Активни автори днес" icon="bi-people-fill">
      <ul className="flex flex-col gap-2.5">
        {data.authors.map((author) => (
          <li key={author.id} className="flex items-center gap-2.5">
            <Avatar username={author.username} imageUrl={author.imageUrl} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[color:var(--color-text-primary)]">{author.username}</p>
              <p className="text-xs text-[color:var(--color-text-muted)]">
                {author.publicationsCount} {author.publicationsCount === 1 ? "публикация" : "публикации"}
              </p>
            </div>
            {renderAuthorFollowSlot?.(author.id)}
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

function LastActivityWidget({ onOpenPost }: { onOpenPost: (id: number) => void }) {
  const { data, isPending } = useLastActivity();
  if (isPending) return <Skeleton className="h-16 w-full" />;
  if (!data?.lastPostId) return null;

  return (
    <WidgetCard title="Последна активност" icon="bi-clock-history">
      <button type="button" onClick={() => onOpenPost(data.lastPostId!)} className="flex items-start gap-2.5 text-left">
        <Avatar username={data.lastPostAuthor ?? "?"} imageUrl={data.lastPostAuthorImage} size={32} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-[color:var(--color-text-primary)] hover:text-primary">
            {data.lastPostTitle}
          </p>
          <p className="text-xs text-[color:var(--color-text-muted)]">
            {data.lastPostAuthor} · <i className="bi bi-hand-thumbs-up" /> {data.lastPostLikes} ·{" "}
            <i className="bi bi-chat" /> {data.lastPostComments}
          </p>
        </div>
      </button>
    </WidgetCard>
  );
}

function PostStatRow({ post, statIcon, statValue, onOpenPost }: {
  post: PublicationStatSummary;
  statIcon: string;
  statValue: number;
  onOpenPost: (id: number) => void;
}) {
  return (
    <button type="button" onClick={() => onOpenPost(post.id!)} className="flex items-start gap-2.5 text-left">
      <Avatar username={post.authorName ?? "?"} imageUrl={post.authorImage} size={32} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-[color:var(--color-text-primary)] hover:text-primary">{post.title}</p>
        <p className="text-xs text-[color:var(--color-text-muted)]">
          {post.authorName} · <i className={cn("bi", statIcon)} /> {statValue}
        </p>
      </div>
    </button>
  );
}

function MostCommentedWidget({ onOpenPost }: { onOpenPost: (id: number) => void }) {
  const { data, isPending } = useMostCommentedToday();
  if (isPending) return <Skeleton className="h-16 w-full" />;
  if (!data?.id) return null;

  return (
    <WidgetCard title="Най-коментирано днес" icon="bi-chat-fill">
      <PostStatRow post={data} statIcon="bi-chat" statValue={data.commentsCount} onOpenPost={onOpenPost} />
    </WidgetCard>
  );
}

function TopViewedWidget({ onOpenPost }: { onOpenPost: (id: number) => void }) {
  const { data, isPending } = useTopViewedToday();
  if (isPending) return <Skeleton className="h-32 w-full" />;
  if (!data || data.length === 0) return null;

  return (
    <WidgetCard title="Най-разглеждани днес" icon="bi-eye-fill">
      <ul className="flex flex-col gap-3">
        {data.map((post) => (
          <li key={post.id}>
            <PostStatRow post={post} statIcon="bi-eye" statValue={post.viewsCount} onOpenPost={onOpenPost} />
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

/** Дясна лента с widgets (MODERN_FRONTEND_PLAN.md §Right sidebar widgets) — всеки widget е самостоятелна заявка, липсващи данни просто скриват widget-a. */
export function PublicationsSidebar({ onOpenPost, onTrendingClick, renderAuthorFollowSlot }: PublicationsSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      <StatsWidget />
      <TopAuthorsWidget renderAuthorFollowSlot={renderAuthorFollowSlot} />
      <TrendingWidget onTrendingClick={onTrendingClick} />
      <LastActivityWidget onOpenPost={onOpenPost} />
      <MostCommentedWidget onOpenPost={onOpenPost} />
      <TopViewedWidget onOpenPost={onOpenPost} />
    </div>
  );
}
