"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api";
import { profileQueryKey } from "./useProfile";
import type { UpdateProfilePayload } from "../types";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.updateMe(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQueryKey(updated.username), updated);
    },
  });
}
