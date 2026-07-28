"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { isWithinSmolyanRegion } from "../lib/geo";
import {
  clearSignalCreateDraft,
  loadSignalCreateDraft,
  saveSignalCreateDraft,
} from "../lib/signalCreateDraft";
import { signalFormSchema, type SignalFormValues } from "../schema";
import { useCreateSignal } from "./useCreateSignal";
import type { Signal, SignalCategory } from "../types";

export interface SelectedLocation {
  latitude: number;
  longitude: number;
}

/** RHF handles title/description/category; location + image are separate state (map click / dropzone). */
export function useCreateSignalForm(onCreated?: (signal: Signal) => void, options?: { draftEnabled?: boolean }) {
  const draftEnabled = options?.draftEnabled ?? true;
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const { mutateAsync: createSignal, isPending } = useCreateSignal();

  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const form = useForm<SignalFormValues>({
    resolver: zodResolver(signalFormSchema),
    mode: "onChange",
    defaultValues: { title: "", description: "", category: undefined },
  });

  useEffect(() => {
    if (!draftEnabled || draftLoaded) return;
    const draft = loadSignalCreateDraft();
    if (draft) {
      form.reset({
        title: draft.title,
        description: draft.description,
        category: draft.category as SignalCategory | undefined,
      });
      if (draft.latitude != null && draft.longitude != null) {
        setLocation({ latitude: draft.latitude, longitude: draft.longitude });
      }
    }
    setDraftLoaded(true);
  }, [draftEnabled, draftLoaded, form]);

  const watched = form.watch();
  useEffect(() => {
    if (!draftEnabled || !draftLoaded) return;
    saveSignalCreateDraft({
      title: watched.title ?? "",
      description: watched.description ?? "",
      category: watched.category,
      latitude: location?.latitude,
      longitude: location?.longitude,
    });
  }, [draftEnabled, draftLoaded, watched.title, watched.description, watched.category, location]);

  function reset() {
    form.reset({ title: "", description: "", category: undefined });
    setLocation(null);
    setImage(null);
    clearSignalCreateDraft();
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
        latitude: location.latitude,
        longitude: location.longitude,
        image: image ?? undefined,
      });
      toast.success("Сигналът е подаден успешно!");
      if (image && !created.imageUrl) {
        toast.warning("Сигналът е създаден, но снимката не бе качена. Можете да я добавите при редакция.");
      }
      reset();
      onCreated?.(created);
    } catch (error) {
      toast.error(errorMessage(error, "Грешка при подаване на сигнала."));
    }
  });

  return { form, onSubmit, isPending, location, setLocation, image, setImage, cancel: reset };
}
