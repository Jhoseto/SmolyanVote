"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Skeleton } from "@/shared/ui";

/** Hands humans off to the feed modal (`?openModal=`); crawlers already got OG from SSR. */
export function PublicationSocialClient({ id }: { id: number }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/publications?openModal=${id}`);
  }, [id, router]);

  return (
    <Container className="py-16">
      <Skeleton className="mx-auto h-8 w-2/3 max-w-lg" />
      <p className="mt-4 text-center text-sm text-[color:var(--color-text-muted)]">
        Пренасочване към публикацията…
      </p>
    </Container>
  );
}
