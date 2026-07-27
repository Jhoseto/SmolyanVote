"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, ImageDropzone, LogoLoader, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { SIGNAL_CATEGORIES } from "../data/categories";
import { isWithinSmolyanRegion } from "../lib/geo";
import { findDuplicateCandidates } from "../lib/findDuplicateSignals";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../schema";
import { useCreateSignalForm } from "../hooks/useCreateSignalForm";
import { useReverseGeocode } from "../hooks/useReverseGeocode";
import { SIGNALS_DATASET_QUERY_KEY } from "../api";
import { SignalModalShell, SignalFieldLabel, SignalSection, signalFieldClass } from "./SignalModalShell";
import type { Signal } from "../types";
import { applyPriorityTiers } from "../lib/computePriorityLevel";

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full rounded-[var(--radius-md)] sm:h-[220px]" />,
  },
);

interface CreateSignalModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (signal: Signal) => void;
  dataset?: Signal[];
}

export function CreateSignalModal({ open, onClose, onCreated, dataset }: CreateSignalModalProps) {
  const queryClient = useQueryClient();
  const allSignals = useMemo(() => {
    const cached = queryClient.getQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY);
    return applyPriorityTiers(dataset ?? cached ?? []);
  }, [dataset, queryClient]);

  const { form, onSubmit, isPending, location, setLocation, image, setImage, cancel } = useCreateSignalForm((signal) => {
    onCreated?.(signal);
    onClose();
  });
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = form;

  const locationValid = location ? isWithinSmolyanRegion(location.latitude, location.longitude) : true;
  const { label: addressLabel, isLoading: isGeocoding } = useReverseGeocode(
    location?.latitude ?? null,
    location?.longitude ?? null,
  );

  const canSubmit = isValid && location && locationValid && !isPending;

  const duplicates = useMemo(
    () =>
      findDuplicateCandidates(
        allSignals,
        watch("title"),
        watch("category"),
        location?.latitude ?? null,
        location?.longitude ?? null,
      ),
    [allSignals, watch("title"), watch("category"), location],
  );

  function handleOpenChange(next: boolean) {
    if (!next && isPending) return;
    if (!next) {
      cancel();
      onClose();
    }
  }

  return (
    <SignalModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Нов сигнал"
      subtitle="Маркирай проблема на картата и опиши го"
      icon="bi-megaphone-fill"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Отказ
          </Button>
          <Button type="submit" onClick={onSubmit} disabled={!canSubmit} className="shadow-[0_4px_14px_rgba(13,110,253,0.3)]">
            {isPending ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin" aria-hidden />
                Качване…
              </>
            ) : (
              "Подай сигнал"
            )}
          </Button>
        </div>
      }
    >
      <div className="relative">
        {isPending ? (
          <LogoLoader overlay label="Качване на сигнала…" showLabel size="md" />
        ) : null}
        <div
          className={cn(
            "flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5",
            isPending && "pointer-events-none select-none opacity-60",
          )}
        >
        <SignalSection title="Местоположение">
          <LocationPickerMap
            value={location}
            onChange={setLocation}
            active={open}
            className="h-[min(36dvh,240px)] w-full overflow-hidden rounded-[var(--radius-md)] border border-border-default/30 shadow-[0_4px_20px_rgba(15,23,42,0.06)] sm:h-[220px]"
          />
          {location && !locationValid && (
            <p className="flex items-start gap-1.5 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-xs text-red-700">
              <i className="bi bi-exclamation-circle mt-0.5 shrink-0" />
              Местоположението трябва да е в границите на област Смолян.
            </p>
          )}
          {!location && (
            <p className="text-xs text-[color:var(--color-text-muted)]">Докоснете картата, за да маркирате проблема.</p>
          )}
          {location && locationValid && (
            <p className="flex items-start gap-2 rounded-[var(--radius-md)] bg-primary-50/60 px-3 py-2 text-xs text-[color:var(--color-text-secondary)]">
              <i className="bi bi-geo-alt mt-0.5 shrink-0 text-primary" />
              {isGeocoding
                ? "Определяне на адрес…"
                : addressLabel ?? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
            </p>
          )}
        </SignalSection>

        <SignalSection title="Детайли">
          {duplicates.length > 0 ? (
            <div className="rounded-[var(--radius-md)] border border-amber-200/70 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-950">
              <p className="mb-1.5 font-semibold">
                <i className="bi bi-exclamation-triangle mr-1" />
                Възможен дубликат наблизо
              </p>
              <ul className="space-y-1">
                {duplicates.map((d) => (
                  <li key={d.signal.id}>
                    „{d.signal.title}“ — {(d.distanceKm * 1000).toFixed(0)} m
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <SignalFieldLabel>Заглавие</SignalFieldLabel>
            <input {...register("title")} maxLength={MAX_TITLE_LENGTH} placeholder="Кратко заглавие на проблема" className={signalFieldClass} />
            <div className="flex items-center justify-between">
              {errors.title ? <p className="text-xs text-red-600">{errors.title.message}</p> : <span />}
              <span className="text-xs text-[color:var(--color-text-muted)]">
                {watch("title").length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <SignalFieldLabel>Описание</SignalFieldLabel>
            <textarea
              {...register("description")}
              rows={4}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="Опиши проблема подробно — къде точно, от колко време, допълнителни детайли…"
              className={cn(signalFieldClass, "resize-none")}
            />
            <div className="flex items-center justify-between">
              {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : <span />}
              <span className="text-xs text-[color:var(--color-text-muted)]">
                {watch("description").length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <SignalFieldLabel htmlFor="signal-category">Категория</SignalFieldLabel>
            <select
              id="signal-category"
              {...register("category")}
              className={cn(signalFieldClass, errors.category && "border-[color:var(--color-error)]")}
            >
              <option value="" disabled>
                Избери категория
              </option>
              {SIGNAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </SignalSection>

        <SignalSection title="Снимка">
          <p className="text-xs text-[color:var(--color-text-muted)]">По избор — снимката помага за по-бърза реакция.</p>
          <ImageDropzone
            files={image ? [image] : []}
            onChange={(files) => setImage(files[0] ?? null)}
            maxFiles={1}
            acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
            maxSizeBytes={5 * 1024 * 1024}
          />
        </SignalSection>
        </div>
      </div>
    </SignalModalShell>
  );
}
