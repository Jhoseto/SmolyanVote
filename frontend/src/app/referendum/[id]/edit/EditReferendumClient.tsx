"use client";

import { Card, Container, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { EditReferendumForm, useReferendumDetail } from "@/features/events";
import { ApiError } from "@/lib/api/client";

export function EditReferendumClient({ id }: { id: number }) {
  const { user, isLoadingUser } = useAuth();
  const { data, isPending, isError, error, refetch } = useReferendumDetail(id);

  if (isLoadingUser || isPending) {
    return <LogoLoader fullScreen size="lg" label="Зареждане…" />;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <EmptyState
        icon="bi-shield-lock"
        title="Нямате достъп"
        description="Само администратор може да редактира референдум."
      />
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState icon="bi-calendar-x" title="Референдумът не е намерен" description="Възможно е да е изтрит." />;
    }
    return <ErrorState description="Референдумът не можа да се зареди." onRetry={() => refetch()} />;
  }

  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)] sm:text-3xl">
        Редактиране на референдум
      </h1>
      <Card className="max-w-2xl p-5 sm:p-6">
        <EditReferendumForm detail={data} />
      </Card>
    </Container>
  );
}
