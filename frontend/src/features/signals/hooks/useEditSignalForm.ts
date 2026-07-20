"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { signalFormSchema, type SignalFormValues } from "../schema";
import { useUpdateSignal } from "./useUpdateSignal";
import type { Signal } from "../types";

/** Update не пипа местоположението (легacy паритет — `PUT` няма lat/lng params). */
export function useEditSignalForm(signal: Signal, onSaved?: () => void) {
  const toast = useToast();
  const { mutateAsync: updateSignal, isPending } = useUpdateSignal(signal.id);
  const [image, setImage] = useState<File | null>(null);

  const form = useForm<SignalFormValues>({
    resolver: zodResolver(signalFormSchema),
    mode: "onChange",
    defaultValues: {
      title: signal.title,
      description: signal.description,
      category: signal.category,
      expirationDays: (signal.expirationDays ?? 3) as 1 | 3 | 7,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateSignal({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        expirationDays: values.expirationDays,
        image: image ?? undefined,
      });
      toast.success("Сигналът е обновен успешно!");
      onSaved?.();
    } catch (error) {
      toast.error(errorMessage(error, "Грешка при обновяване на сигнала."));
    }
  });

  return { form, onSubmit, isPending, image, setImage };
}
