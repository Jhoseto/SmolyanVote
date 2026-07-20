"use client";

import { Button, ImageDropzone } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { LOCATIONS } from "../data/locations";
import { MAX_IMAGES } from "../schema";
import { useEditMultiPollForm } from "../hooks/useEditMultiPollForm";
import { ExistingImagesManager } from "./ExistingImagesManager";
import { OptionsListEditor } from "./OptionsListEditor";
import type { MultiPollDetail } from "../types";

const inputClass =
  "mt-1.5 w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";
const labelClass = "block text-sm font-medium text-[color:var(--color-text-primary)]";
const errorClass = "mt-1 text-xs text-red-600";

/** Admin inline edit for a multi-poll (multi-option). */
export function EditMultiPollForm({ detail }: { detail: MultiPollDetail }) {
  const toast = useToast();
  const { form, onSubmit, isPending, newImages, setNewImages, deletedImageIds, toggleDeleteImage } =
    useEditMultiPollForm(detail);
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const remainingSlots = Math.max(0, MAX_IMAGES - (detail.imageRefs.length - deletedImageIds.length));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="mp-edit-title" className={labelClass}>
          Заглавие
        </label>
        <input id="mp-edit-title" type="text" maxLength={150} {...register("title")} className={inputClass} />
        <div className="mt-1 flex items-center justify-between">
          {errors.title ? <p className={errorClass}>{errors.title.message}</p> : <span />}
          <span className="text-xs text-[color:var(--color-text-muted)]">{watch("title").length}/150</span>
        </div>
      </div>

      <div>
        <label htmlFor="mp-edit-description" className={labelClass}>
          Описание
        </label>
        <textarea
          id="mp-edit-description"
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
        <label htmlFor="mp-edit-location" className={labelClass}>
          Населено място
        </label>
        <select id="mp-edit-location" {...register("location")} className={inputClass}>
          <option value="">Изберете...</option>
          {LOCATIONS.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.label}
            </option>
          ))}
        </select>
        {errors.location && <p className={errorClass}>{errors.location.message}</p>}
      </div>

      <OptionsListEditor
        options={watch("options")}
        onChange={(next) => setValue("options", next, { shouldValidate: true })}
        error={errors.options?.message}
      />
      <p className="text-xs text-[color:var(--color-text-muted)]">
        Внимание: вече подадените гласове са свързани с позицията на опцията — промяна на реда или премахване на
        опция може да разбърка резултатите.
      </p>

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
