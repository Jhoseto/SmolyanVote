"use client";

import { Card, Container, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { EditSimpleEventForm, useSimpleEventDetail } from "@/features/events";
import { ApiError } from "@/lib/api/client";

export function EditSimpleEventClient({ id }: { id: number }) {
  const { user, isLoadingUser } = useAuth();
  const { data, isPending, isError, error, refetch } = useSimpleEventDetail(id);

  if (isLoadingUser || isPending) {
    return <LogoLoader fullScreen size="lg" label="Зареждане…" />;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <EmptyState
        icon="bi-shield-lock"
        title="Нямате достъп"
        description="Само администратор може да редактира събитие."
      />
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState icon="bi-calendar-x" title="Събитието не е намерено" description="Възможно е да е изтрито." />;
    }
    return <ErrorState description="Събитието не можа да се зареди." onRetry={() => refetch()} />;
  }

  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)] sm:text-3xl">
        Редактиране на събитие
      </h1>
      <Card className="max-w-2xl p-5 sm:p-6">
        <EditSimpleEventForm detail={data} />
      </Card>
    </Container>
  );
}

