"use client";

import { Button } from "@/shared/ui";
import { usePodcastSubscription } from "../hooks/usePodcastSubscription";

/** Subscribe/unsubscribe toggle for new episode notifications (MODERN_FRONTEND_PLAN §Фаза 6). */
export function PodcastSubscribeButton({ className }: { className?: string }) {
  const { isSubscribed, toggle, isPending } = usePodcastSubscription();

  return (
    <Button
      type="button"
      variant={isSubscribed ? "outline" : "primary"}
      size="sm"
      onClick={toggle}
      disabled={isPending}
      className={className}
    >
      <i className={`bi ${isSubscribed ? "bi-bell-slash" : "bi-bell-plus"}`} />
      {isSubscribed ? "Отабонирай се" : "Абонирай се за нови епизоди"}
    </Button>
  );
}
