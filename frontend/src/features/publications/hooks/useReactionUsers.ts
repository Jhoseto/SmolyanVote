"use client";

import { useQuery } from "@tanstack/react-query";
import { publicationsApi } from "../api";

export function useReactionUsers(id: number | null, type: "like" | "dislike") {
  return useQuery({
    queryKey: ["publications", "reaction-users", type, id],
    queryFn: () => (type === "like" ? publicationsApi.likedUsers(id as number) : publicationsApi.dislikedUsers(id as number)),
    enabled: id != null,
  });
}
