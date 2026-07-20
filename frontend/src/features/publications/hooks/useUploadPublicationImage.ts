"use client";

import { useMutation } from "@tanstack/react-query";
import { publicationsApi } from "../api";

export function useUploadPublicationImage() {
  return useMutation({
    mutationFn: (image: File) => publicationsApi.uploadImage(image),
  });
}
