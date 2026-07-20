"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followApi } from "../api";

export function useToggleFollow(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currentlyFollowing: boolean) =>
      currentlyFollowing ? followApi.unfollow(userId) : followApi.follow(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["follow", "status", userId] });
    },
  });
}
