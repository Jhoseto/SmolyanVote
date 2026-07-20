"use client";

import { Button, ImageDropzone } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { LOCATIONS } from "../data/locations";
import { MAX_IMAGES } from "../schema";
import { useCreateMultiPollForm } from "../hooks/useCreateMultiPollForm";
import { OptionsListEditor } from "./OptionsListEditor";

const inputClass =
  "mt-1.5 w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";
const labelClass = "block text-sm font-medium text-[color:var(--color-text-primary)]";
const errorClass = "mt-1 text-xs text-red-600";

/** Create form for a multi-poll (multi-option) — JSON API parity with `createMultiPoll.html`. */
export function CreateMultiPollForm() {
  const toast = useToast();
  const { form, onSubmit, isPending, images, setImages } = useCreateMultiPollForm();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="mp-title" className={labelClass}>
          Заглавие
        </label>
        <input id="mp-title" type="text" maxLength={150} {...register("title")} className={inputClass} />
        <div className="mt-1 flex items-center justify-between">
          {errors.title ? <p className={errorClass}>{errors.title.message}</p> : <span />}
          <span className="text-xs text-[color:var(--color-text-muted)]">{watch("title").length}/150</span>
        </div>
      </div>

      <div>
        <label htmlFor="mp-description" className={labelClass}>
          Описание
        </label>
        <textarea
          id="mp-description"
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
        <label htmlFor="mp-location" className={labelClass}>
          Населено място
        </label>
        <select id="mp-location" {...register("location")} className={inputClass}>
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

      <div>
        <label className={labelClass}>Снимки (по избор)</label>
        <ImageDropzone
          className="mt-1.5"
          files={images}
          onChange={setImages}
          maxFiles={MAX_IMAGES}
          onError={(message) => toast.error(message)}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Създаване..." : "Създай анкета"}
      </Button>
    </form>
  );
}
