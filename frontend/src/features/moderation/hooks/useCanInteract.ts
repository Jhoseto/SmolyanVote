"use client";

import { useAuth } from "@/shared/lib/authContext";

/** True when the user may post, comment, vote, etc. */
export function useCanInteract(): boolean {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return false;
  return !user.readOnly;
}
