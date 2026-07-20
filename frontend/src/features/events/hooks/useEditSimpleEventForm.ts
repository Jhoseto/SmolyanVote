"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { createSimpleEventSchema, type CreateSimpleEventFormValues } from "../schema";
import { useUpdateSimpleEvent } from "./useUpdateSimpleEvent";
import type { SimpleEventDetail } from "../types";

/** Admin inline edit — same RHF/Zod shape as create, prefilled from the current detail. */
export function useEditSimpleEventForm(detail: SimpleEventDetail) {
  const router = useRouter();
  const toast = useToast();
  const { mutate, isPending } = useUpdateSimpleEvent();
  const [newImages, setNewImages] = useState<File[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  const form = useForm<CreateSimpleEventFormValues>({
    resolver: zodResolver(createSimpleEventSchema),
    defaultValues: {
      title: detail.title,
      description: detail.description,
      location: detail.location,
      positiveLabel: detail.positiveLabel,
      negativeLabel: detail.negativeLabel,
      neutralLabel: detail.neutralLabel,
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
          router.push(`/event/${detail.id}`);
        },
        onError: (error) => toast.error(errorMessage(error, "Грешка при запазването на промените.")),
      },
    );
  });

  return { form, onSubmit, isPending, newImages, setNewImages, deletedImageIds, toggleDeleteImage };
}
