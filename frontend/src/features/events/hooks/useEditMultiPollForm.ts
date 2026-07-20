"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { createMultiPollSchema, type CreateMultiPollFormValues } from "../schema";
import { useUpdateMultiPoll } from "./useUpdateMultiPoll";
import type { MultiPollDetail } from "../types";

/** Admin inline edit — same RHF/Zod shape as create, prefilled from the current detail. */
export function useEditMultiPollForm(detail: MultiPollDetail) {
  const router = useRouter();
  const toast = useToast();
  const { mutate, isPending } = useUpdateMultiPoll();
  const [newImages, setNewImages] = useState<File[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  const form = useForm<CreateMultiPollFormValues>({
    resolver: zodResolver(createMultiPollSchema),
    defaultValues: {
      title: detail.title,
      description: detail.description,
      location: detail.location,
      options: detail.optionsText,
    },
  });

  function toggleDeleteImage(imageId: number) {
    setDeletedImageIds((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]));
  }

  const onSubmit = form.handleSubmit((values) => {
    mutate(
      { id: detail.id, values, newImages, deleteImageIds: deletedImageIds },
      {
        onSuccess: () => {
          toast.success("Промените са запазени.");
          router.push(`/multipoll/${detail.id}`);
        },
        onError: (error) => toast.error(errorMessage(error, "Грешка при запазването на промените.")),
      },
    );
  });

  return { form, onSubmit, isPending, newImages, setNewImages, deletedImageIds, toggleDeleteImage };
}
