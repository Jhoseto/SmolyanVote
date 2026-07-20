"use client";

import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useFollowStatus } from "../hooks/useFollowStatus";
import { useToggleFollow } from "../hooks/useToggleFollow";

interface FollowButtonProps {
  userId: number;
  className?: string;
}

/** Caller decides visibility (hide for guests / for the viewer's own content) — this button only handles the toggle itself. */
export function FollowButton({ userId, className }: FollowButtonProps) {
  const { isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const { data } = useFollowStatus(userId, isAuthenticated);
  const { mutate, isPending } = useToggleFollow(userId);

  const isFollowing = data?.following ?? false;

  async function handleClick() {
    if (!(await requireAuth("да следваш автори"))) return;
    mutate(isFollowing, {
      onError: (error) => toast.error(errorMessage(error, "Действието не бе успешно.")),
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        className ??
        cn(
          "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
          isFollowing
            ? "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-error)]"
            : "bg-primary-50 text-primary hover:bg-primary/15",
        )
      }
    >
      <i className={cn("bi", isFollowing ? "bi-person-check-fill" : "bi-person-plus")} />
      {isFollowing ? "Следваш" : "Следвай"}
    </button>
  );
}
