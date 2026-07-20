"use client";

import { Button, Card, ImageDropzone } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { SIGNAL_CATEGORIES } from "../data/categories";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../schema";
import { useEditSignalForm } from "../hooks/useEditSignalForm";
import type { Signal } from "../types";

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";

interface SignalEditFormProps {
  signal: Signal;
  onSaved: () => void;
  onCancel: () => void;
}

/** Legacy паритет — редакция не пипа местоположението, само title/description/category/expiration/image. */
export function SignalEditForm({ signal, onSaved, onCancel }: SignalEditFormProps) {
  const { form, onSubmit, isPending, image, setImage } = useEditSignalForm(signal, onSaved);
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = form;

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <input {...register("title")} maxLength={MAX_TITLE_LENGTH} placeholder="Заглавие" className={inputClass} />
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
          placeholder="Описание"
          className={cn(inputClass, "resize-none")}
        />
        <div className="flex items-center justify-between">
          {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : <span />}
          <span className="text-xs text-[color:var(--color-text-muted)]">
            {watch("description").length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>

      <select {...register("category")} className={inputClass}>
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

      {signal.imageUrl && !image && (
        <div className="overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL */}
          <img src={signal.imageUrl} alt="" className="max-h-[240px] w-full object-cover" />
        </div>
      )}
      <ImageDropzone
        files={image ? [image] : []}
        onChange={(files) => setImage(files[0] ?? null)}
        maxFiles={1}
        acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
        maxSizeBytes={5 * 1024 * 1024}
      />

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Отказ
        </Button>
        <Button type="submit" onClick={onSubmit} disabled={isPending || !isValid}>
          {isPending ? "Запазване…" : "Запази"}
        </Button>
      </div>
    </Card>
  );
}
