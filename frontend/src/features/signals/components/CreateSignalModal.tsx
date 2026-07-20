"use client";

import dynamic from "next/dynamic";
import { Dialog } from "@base-ui/react/dialog";
import { Button, ImageDropzone, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { SIGNAL_CATEGORIES } from "../data/categories";
import { isWithinSmolyanRegion } from "../lib/geo";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../schema";
import { useCreateSignalForm } from "../hooks/useCreateSignalForm";
import type { Signal } from "../types";

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-[var(--radius-md)]" />,
  },
);

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";

interface CreateSignalModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (signal: Signal) => void;
}

/** Map click / image dropzone (5MB, JPG/PNG/WEBP) / category+expiration/validation/submit (MODERN_FRONTEND_PLAN §Create signal). */
export function CreateSignalModal({ open, onClose, onCreated }: CreateSignalModalProps) {
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

  function handleOpenChange(next: boolean) {
    if (!next) {
      cancel();
      onClose();
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/50 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-start justify-center overflow-y-auto p-4 outline-none sm:items-center">
          <div className="my-8 w-full max-w-[640px] rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            <div className="flex items-center justify-between border-b border-border-default/60 p-4">
              <Dialog.Title className="text-base font-semibold text-[color:var(--color-text-heading)]">
                Нов сигнал
              </Dialog.Title>
              <Dialog.Close
                aria-label="Затвори"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]"
              >
                <i className="bi bi-x-lg" />
              </Dialog.Close>
            </div>

            <div className="flex flex-col gap-4 p-4 sm:p-6">
              <LocationPickerMap value={location} onChange={setLocation} className="h-[240px] w-full overflow-hidden rounded-[var(--radius-md)]" />
              {location && !locationValid && (
                <p className="text-xs text-[color:var(--color-error)]">
                  Местоположението трябва да е в границите на област Смолян. Изберете точка вътре в очертаната зона.
                </p>
              )}
              {!location && <p className="text-xs text-[color:var(--color-text-muted)]">Още не сте избрали местоположение.</p>}

              <div className="flex flex-col gap-1.5">
                <input {...register("title")} maxLength={MAX_TITLE_LENGTH} placeholder="Заглавие на сигнала" className={inputClass} />
                <div className="flex items-center justify-between">
                  {errors.title ? <p className="text-xs text-red-600">{errors.title.message}</p> : <span />}
                  <span className="text-xs text-[color:var(--color-text-muted)]">
                    {watch("title").length}/{MAX_TITLE_LENGTH}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <textarea
                  {...register("description")}
                  rows={4}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Описание на проблема"
                  className={cn(inputClass, "resize-none")}
                />
                <div className="flex items-center justify-between">
                  {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : <span />}
                  <span className="text-xs text-[color:var(--color-text-muted)]">
                    {watch("description").length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </div>

              <select {...register("category")} className={cn(inputClass, errors.category && "border-[color:var(--color-error)]")}>
                <option value="" disabled>
                  Избери категория
                </option>
                {SIGNAL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <select {...register("expirationDays", { valueAsNumber: true })} className={inputClass}>
                <option value={1}>Активен 1 ден</option>
                <option value={3}>Активен 3 дни</option>
                <option value={7}>Активен 7 дни</option>
              </select>

              <ImageDropzone
                files={image ? [image] : []}
                onChange={(files) => setImage(files[0] ?? null)}
                maxFiles={1}
                acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
                maxSizeBytes={5 * 1024 * 1024}
              />

              <div className="flex items-center justify-end gap-2 border-t border-border-default/60 pt-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Отказ
                </Button>
                <Button type="submit" onClick={onSubmit} disabled={isPending || !isValid || !location || !locationValid}>
                  {isPending ? "Подаване…" : "Подай сигнал"}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
