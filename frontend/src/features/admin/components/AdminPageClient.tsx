"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Container, EmptyState, LogoLoader, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import type { AdminTab } from "../types";
import { HealthDashboard } from "./HealthDashboard";
import { UsersPanel } from "./UsersPanel";
import { ReportsPanel } from "./ReportsPanel";

const ActivityPanel = dynamic(
  () => import("./ActivityPanel").then((m) => m.ActivityPanel),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />,
  },
);

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: "health", label: "Health", icon: "bi-heart-pulse" },
  { id: "users", label: "Потребители", icon: "bi-people" },
  { id: "reports", label: "Репорти", icon: "bi-flag" },
  { id: "activity", label: "Activity", icon: "bi-activity" },
];

export function AdminPageClient() {
  const { user, isLoadingUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("health");

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
          Мониторинг, потребители, репорти и activity wall
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-border-default/60 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
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

      {tab === "health" && <HealthDashboard enabled />}
      {tab === "users" && <UsersPanel enabled />}
      {tab === "reports" && <ReportsPanel enabled />}
      {tab === "activity" && <ActivityPanel enabled />}
    </Container>
  );
}
