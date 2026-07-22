"use client";

import { Button, ImageDropzone } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { SIGNAL_CATEGORIES } from "../data/categories";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../schema";
import { useEditSignalForm } from "../hooks/useEditSignalForm";
import { signalFieldClass, SignalFieldLabel } from "./SignalModalShell";
import type { Signal } from "../types";

interface SignalEditFormProps {
  signal: Signal;
  onSaved: () => void;
  onCancel: () => void;
}

export function SignalEditForm({ signal, onSaved, onCancel }: SignalEditFormProps) {
  const { form, onSubmit, isPending, image, setImage, removeImage, setRemoveImage } = useEditSignalForm(signal, onSaved);
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = form;

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border-default/30 bg-gradient-to-b from-[color:var(--color-surface-light)]/80 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="flex flex-col gap-1.5">
        <SignalFieldLabel>Заглавие</SignalFieldLabel>
        <input {...register("title")} maxLength={MAX_TITLE_LENGTH} placeholder="Заглавие" className={signalFieldClass} />
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
          placeholder="Описание"
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
        <SignalFieldLabel>Категория</SignalFieldLabel>
        <select {...register("category")} className={signalFieldClass}>
          {SIGNAL_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {signal.imageUrl && !image && (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-[var(--radius-md)] ring-1 ring-border-default/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signal.imageUrl} alt="" className="max-h-[240px] w-full object-cover" />
          </div>
          <label className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={removeImage}
              onChange={(e) => setRemoveImage(e.target.checked)}
              className="accent-[color:var(--color-primary)]"
            />
            Премахни снимката
          </label>
        </div>
      )}

      <ImageDropzone
        files={image ? [image] : []}
        onChange={(files) => setImage(files[0] ?? null)}
        maxFiles={1}
        acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
        maxSizeBytes={5 * 1024 * 1024}
      />

      <div className="flex items-center justify-end gap-2 border-t border-border-default/30 pt-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Отказ
        </Button>
        <Button type="submit" onClick={onSubmit} disabled={isPending || !isValid}>
          {isPending ? "Запазване…" : "Запази"}
        </Button>
      </div>
    </div>
  );
}
