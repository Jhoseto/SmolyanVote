"use client";

import { MAX_OPTIONS, MIN_OPTIONS } from "../schema";

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
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-[color:var(--color-text-primary)]">Опции</label>
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={option}
            onChange={(e) => updateAt(index, e.target.value)}
            placeholder={`Опция ${index + 1}`}
            maxLength={100}
            className="w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
          />
          {options.length > MIN_OPTIONS && (
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Премахни опция ${index + 1}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[color:var(--color-text-muted)] hover:bg-red-50 hover:text-[color:var(--color-error)]"
            >
              <i className="bi bi-trash3" />
            </button>
          )}
        </div>
      ))}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={addOption}
          className="inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border-default/60 px-3 py-1.5 text-sm font-medium text-primary hover:border-primary hover:bg-primary-50"
        >
          <i className="bi bi-plus-lg" />
          Добави опция
        </button>
      )}
    </div>
  );
}
