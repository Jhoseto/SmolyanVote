"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signalsApi } from "../api";
import { patchSignalCaches } from "../lib/signalsCache";

export function useToggleSignalLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => signalsApi.like(id),
    onSuccess: (result, id) => {
      patchSignalCaches(queryClient, id, { isLiked: result.isLiked, likesCount: result.likesCount });
    },
  });
}
