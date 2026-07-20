"use client";

import { Card, Container, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { EditMultiPollForm, useMultiPollDetail } from "@/features/events";
import { ApiError } from "@/lib/api/client";

export function EditMultiPollClient({ id }: { id: number }) {
  const { user, isLoadingUser } = useAuth();
  const { data, isPending, isError, error, refetch } = useMultiPollDetail(id);

  if (isLoadingUser || isPending) {
    return <LogoLoader fullScreen size="lg" label="Зареждане…" />;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <EmptyState
        icon="bi-shield-lock"
        title="Нямате достъп"
        description="Само администратор може да редактира анкета."
      />
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState icon="bi-calendar-x" title="Анкетата не е намерена" description="Възможно е да е изтрита." />;
    }
    return <ErrorState description="Анкетата не можа да се зареди." onRetry={() => refetch()} />;
  }

  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)] sm:text-3xl">
        Редактиране на анкета
      </h1>
      <Card className="max-w-2xl p-5 sm:p-6">
        <EditMultiPollForm detail={data} />
      </Card>
    </Container>
  );
}
