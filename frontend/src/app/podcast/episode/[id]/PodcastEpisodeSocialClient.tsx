"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Skeleton } from "@/shared/ui";

export function PodcastEpisodeSocialClient({ id }: { id: number }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/podcast?episode=${id}`);
  }, [id, router]);

  return (
    <Container className="py-16">
      <Skeleton className="mx-auto h-8 w-2/3 max-w-lg" />
      <p className="mt-4 text-center text-sm text-[color:var(--color-text-muted)]">
        Пренасочване към плейъра…
      </p>
    </Container>
  );
}
