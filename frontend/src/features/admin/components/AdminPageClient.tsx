"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, EmptyState, LogoLoader, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import type { AdminTab } from "../types";
import { OverviewPanel } from "./OverviewPanel";
import { HealthDashboard } from "./HealthDashboard";
import { UsersPanel } from "./UsersPanel";
import { ReportsPanel } from "./ReportsPanel";
import { ModerationInboxPanel } from "./ModerationInboxPanel";
import { ModerationPanel } from "./ModerationPanel";
import { ContentPanel } from "./ContentPanel";
import { PodcastAdminPanel } from "./PodcastAdminPanel";
import { MonitorAdminPanel } from "./MonitorAdminPanel";
import { EventsAdminPanel } from "./EventsAdminPanel";
import { SubscriptionsPanel } from "./SubscriptionsPanel";

const ActivityPanel = dynamic(
  () => import("./ActivityPanel").then((m) => m.ActivityPanel),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />,
  },
);

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: "overview", label: "Обзор", icon: "bi-grid" },
  { id: "health", label: "Здраве", icon: "bi-heart-pulse" },
  { id: "inbox", label: "Inbox", icon: "bi-inbox" },
  { id: "users", label: "Потребители", icon: "bi-people" },
  { id: "reports", label: "Репорти", icon: "bi-flag" },
  { id: "content", label: "Съдържание", icon: "bi-collection" },
  { id: "podcast", label: "Подкаст", icon: "bi-mic" },
  { id: "monitor", label: "Граждански монитор", icon: "bi-shield-check" },
  { id: "events", label: "Събития", icon: "bi-calendar-event" },
  { id: "moderation", label: "Profanity", icon: "bi-shield-check" },
  { id: "activity", label: "Активност", icon: "bi-activity" },
  { id: "subscriptions", label: "Абонати", icon: "bi-envelope" },
];

const TAB_IDS = new Set(TABS.map((t) => t.id));

function parseTab(value: string | null): AdminTab {
  if (value && TAB_IDS.has(value as AdminTab)) return value as AdminTab;
  return "overview";
}

export function AdminPageClient() {
  const { user, isLoadingUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<AdminTab>(() => parseTab(searchParams.get("tab")));

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const selectTab = (next: AdminTab) => {
    setTab(next);
    router.replace(`/admin?tab=${next}`, { scroll: false });
  };

  if (isLoadingUser) {
    return <LogoLoader fullScreen size="lg" label="Зареждане на админ панел…" />;
  }

  if (!user) {
    return (
      <Container className="py-16">
        <EmptyState
          icon="bi-shield-lock"
          title="Изисква се вход"
          description="Влезте като администратор, за да отворите панела."
          action={
            <button
              type="button"
              onClick={() => {
                useLoginGateStore.getState().open("login");
                router.push("/");
              }}
              className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm text-white"
            >
              Вход
            </button>
          }
        />
      </Container>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <Container className="py-16">
        <EmptyState
          icon="bi-shield-x"
          title="Нямате достъп"
          description="Админ панелът е достъпен само за потребители с роля ADMIN."
        />
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-6 py-8">
      <header>
        <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)] sm:text-3xl">
          Админ панел
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Модерация, потребители, съдържание и системен мониторинг
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-border-default/60 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-[image:var(--gradient-primary)] text-white"
                : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-muted)]",
            )}
          >
            <i className={cn("bi", t.icon)} />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && <OverviewPanel enabled />}
      {tab === "health" && <HealthDashboard enabled />}
      {tab === "inbox" && <ModerationInboxPanel enabled />}
      {tab === "users" && <UsersPanel enabled />}
      {tab === "reports" && <ReportsPanel enabled />}
      {tab === "content" && <ContentPanel enabled />}
      {tab === "podcast" && <PodcastAdminPanel enabled />}
      {tab === "monitor" && <MonitorAdminPanel enabled />}
      {tab === "events" && <EventsAdminPanel enabled />}
      {tab === "moderation" && <ModerationPanel enabled />}
      {tab === "activity" && <ActivityPanel enabled />}
      {tab === "subscriptions" && <SubscriptionsPanel enabled />}
    </Container>
  );
}
