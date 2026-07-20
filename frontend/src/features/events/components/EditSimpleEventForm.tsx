"use client";

import { Button, ImageDropzone } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { LOCATIONS } from "../data/locations";
import { MAX_IMAGES } from "../schema";
import { useEditSimpleEventForm } from "../hooks/useEditSimpleEventForm";
import { ExistingImagesManager } from "./ExistingImagesManager";
import type { SimpleEventDetail } from "../types";

const inputClass =
  "mt-1.5 w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";
const labelClass = "block text-sm font-medium text-[color:var(--color-text-primary)]";
const errorClass = "mt-1 text-xs text-red-600";

/** Admin inline edit for a simple (yes/no/neutral) event. */
export function EditSimpleEventForm({ detail }: { detail: SimpleEventDetail }) {
  const toast = useToast();
  const { form, onSubmit, isPending, newImages, setNewImages, deletedImageIds, toggleDeleteImage } =
    useEditSimpleEventForm(detail);
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const remainingSlots = Math.max(0, MAX_IMAGES - (detail.imageRefs.length - deletedImageIds.length));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="se-edit-title" className={labelClass}>
          Заглавие
        </label>
        <input id="se-edit-title" type="text" maxLength={100} {...register("title")} className={inputClass} />
        <div className="mt-1 flex items-center justify-between">
          {errors.title ? <p className={errorClass}>{errors.title.message}</p> : <span />}
          <span className="text-xs text-[color:var(--color-text-muted)]">{watch("title").length}/100</span>
        </div>
      </div>

      <div>
        <label htmlFor="se-edit-description" className={labelClass}>
          Описание
        </label>
        <textarea
          id="se-edit-description"
          rows={6}
          maxLength={1000}
          {...register("description")}
          className={inputClass}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.description ? <p className={errorClass}>{errors.description.message}</p> : <span />}
          <span className="text-xs text-[color:var(--color-text-muted)]">{watch("description").length}/1000</span>
        </div>
      </div>

      <div>
        <label htmlFor="se-edit-location" className={labelClass}>
          Населено място
        </label>
        <select id="se-edit-location" {...register("location")} className={inputClass}>
          <option value="">Изберете...</option>
          {LOCATIONS.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.label}
            </option>
          ))}
        </select>
        {errors.location && <p className={errorClass}>{errors.location.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="se-edit-positive" className={labelClass}>
            Етикет „ЗА“
          </label>
          <input
            id="se-edit-positive"
            type="text"
            maxLength={80}
            {...register("positiveLabel")}
            className={inputClass}
          />
          {errors.positiveLabel && <p className={errorClass}>{errors.positiveLabel.message}</p>}
        </div>
        <div>
          <label htmlFor="se-edit-negative" className={labelClass}>
            Етикет „ПРОТИВ“
          </label>
          <input
            id="se-edit-negative"
            type="text"
            maxLength={80}
            {...register("negativeLabel")}
            className={inputClass}
          />
          {errors.negativeLabel && <p className={errorClass}>{errors.negativeLabel.message}</p>}
        </div>
        <div>
          <label htmlFor="se-edit-neutral" className={labelClass}>
            Неутрален етикет
          </label>
          <input
            id="se-edit-neutral"
            type="text"
            maxLength={80}
            {...register("neutralLabel")}
            className={inputClass}
          />
          {errors.neutralLabel && <p className={errorClass}>{errors.neutralLabel.message}</p>}
        </div>
      </div>

      <ExistingImagesManager
        images={detail.imageRefs}
        deletedIds={deletedImageIds}
        onToggle={toggleDeleteImage}
      />

      <div>
        <label className={labelClass}>Нови снимки (по избор)</label>
        <ImageDropzone
          className="mt-1.5"
          files={newImages}
          onChange={setNewImages}
          maxFiles={remainingSlots}
          onError={(message) => toast.error(message)}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Запазване..." : "Запази промените"}
      </Button>
    </form>
  );
}
