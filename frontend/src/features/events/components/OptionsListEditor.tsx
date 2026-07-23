"use client";

import { MAX_OPTIONS, MIN_OPTIONS } from "../schema";
import { createFormErrorClass, createFormHintClass, createFormInputClass } from "./CreateFormChrome";

interface OptionsListEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
  error?: string;
}

/** Add/remove options (2-10, 100 chars each) — shared by referendum + multipoll create forms. */
export function OptionsListEditor({ options, onChange, error }: OptionsListEditorProps) {
  function updateAt(index: number, value: string) {
    onChange(options.map((o, i) => (i === index ? value.slice(0, 100) : o)));
  }

  function removeAt(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  function addOption() {
    onChange([...options, ""]);
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 font-sans text-[0.78rem] font-semibold text-primary ring-1 ring-primary/15">
            {index + 1}
          </span>
          <input
            type="text"
            value={option}
            onChange={(e) => updateAt(index, e.target.value)}
            placeholder={`Текст на опция ${index + 1}`}
            maxLength={100}
            aria-label={`Опция ${index + 1}`}
            className={`${createFormInputClass} mt-0`}
          />
          {options.length > MIN_OPTIONS && (
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Премахни опция ${index + 1}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[color:var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-[color:var(--color-error)]"
            >
              <i className="bi bi-trash3" />
            </button>
          )}
        </div>
      ))}

      {error ? (
        <p className={createFormErrorClass}>
          <i className="bi bi-exclamation-circle mt-px shrink-0 text-[0.85rem]" />
          <span>{error}</span>
        </p>
      ) : (
        <p className={createFormHintClass}>
          <i className="bi bi-info-circle mt-px shrink-0 text-[0.85rem] text-primary/55" />
          <span className="text-pretty">Кратки и сравними формулировки работят най-добре.</span>
        </p>
      )}

      {options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={addOption}
          className="inline-flex w-fit items-center gap-1.5 rounded-[12px] border border-dashed border-primary/35 bg-primary-50/50 px-3.5 py-2 font-sans text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary-50"
        >
          <i className="bi bi-plus-lg" />
          Добави опция
        </button>
      )}
    </div>
  );
}
