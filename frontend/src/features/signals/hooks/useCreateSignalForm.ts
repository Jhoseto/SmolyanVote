"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { isWithinSmolyanRegion } from "../lib/geo";
import { signalFormSchema, type SignalFormValues } from "../schema";
import { useCreateSignal } from "./useCreateSignal";
import type { Signal } from "../types";

export interface SelectedLocation {
  latitude: number;
  longitude: number;
}

/** RHF handles title/description/category/expirationDays; location + image are separate state (map click / dropzone, not text inputs) — mirrors `useCreatePublicationForm`'s split of RHF vs. ad-hoc state. */
export function useCreateSignalForm(onCreated?: (signal: Signal) => void) {
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const { mutateAsync: createSignal, isPending } = useCreateSignal();

  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [image, setImage] = useState<File | null>(null);

  const form = useForm<SignalFormValues>({
    resolver: zodResolver(signalFormSchema),
    mode: "onChange",
    defaultValues: { title: "", description: "", category: undefined, expirationDays: 3 },
  });

  function reset() {
    form.reset({ title: "", description: "", category: undefined, expirationDays: 3 });
    setLocation(null);
    setImage(null);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!(await requireAuth("да подадеш сигнал"))) return;

    if (!location) {
      toast.error("Изберете местоположение на картата.");
      return;
    }
    if (!isWithinSmolyanRegion(location.latitude, location.longitude)) {
      toast.error("Местоположението трябва да е в границите на област Смолян.");
      return;
    }

    try {
      const created = await createSignal({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        expirationDays: values.expirationDays,
        latitude: location.latitude,
        longitude: location.longitude,
        image: image ?? undefined,
      });
      toast.success("Сигналът е подаден успешно!");
      reset();
      onCreated?.(created);
    } catch (error) {
      toast.error(errorMessage(error, "Грешка при подаване на сигнала."));
    }
  });

  return { form, onSubmit, isPending, location, setLocation, image, setImage, cancel: reset };
}
