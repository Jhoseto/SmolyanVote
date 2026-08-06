"use client";

import { useMemo } from "react";
import {
  EmojiPicker,
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
} from "frimousse";
import { LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

const PICKER_COLUMNS = 8;

function CategoryHeader({ category, className, ...props }: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className={cn(
        "px-2 py-1 text-[10px] font-semibold tracking-wide text-[color:var(--color-text-muted)]",
        className,
      )}
    >
      {category.label}
    </div>
  );
}

function EmojiRow({ children, style, className, ...props }: EmojiPickerListRowProps) {
  return (
    <div
      {...props}
      style={{
        ...style,
        display: "grid",
        gridTemplateColumns: `repeat(${PICKER_COLUMNS}, minmax(0, 1fr))`,
        width: "100%",
      }}
      className={cn(className)}
    >
      {children}
    </div>
  );
}

function EmojiButton({ emoji, className, style, ...props }: EmojiPickerListEmojiProps) {
  return (
    <button
      {...props}
      type="button"
      style={style}
      className={cn(
        "flex h-8 w-full items-center justify-center rounded-md text-[1.25rem] leading-none transition-colors hover:bg-black/[0.06]",
        emoji.isActive && "bg-[color:var(--color-primary-50)]",
        className,
      )}
    >
      {emoji.emoji}
    </button>
  );
}

const LIST_COMPONENTS = {
  CategoryHeader,
  Row: EmojiRow,
  Emoji: EmojiButton,
};

interface MessengerEmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function MessengerEmojiPicker({ onSelect }: MessengerEmojiPickerProps) {
  const components = useMemo(() => LIST_COMPONENTS, []);

  return (
    <div className="sv-msg-emoji-picker sv-msg-tile mb-1.5 h-48 overflow-hidden rounded-[8px] bg-white">
      <EmojiPicker.Root
        className="flex h-full flex-col"
        columns={PICKER_COLUMNS}
        onEmojiSelect={({ emoji }) => onSelect(emoji)}
      >
        <EmojiPicker.Search
          placeholder="Търси емоджи…"
          className="border-b border-border-default/60 px-3 py-2 text-sm outline-none"
        />
        <EmojiPicker.Viewport className="sv-msg-emoji-viewport relative min-h-0 flex-1 overflow-y-auto">
          <EmojiPicker.Loading className="flex justify-center p-3">
            <LogoLoader size="sm" label="Зареждане…" />
          </EmojiPicker.Loading>
          <EmojiPicker.Empty className="p-3 text-center text-xs text-[color:var(--color-text-muted)]">
            Няма резултати
          </EmojiPicker.Empty>
          <EmojiPicker.List className="w-full select-none pb-2" components={components} />
        </EmojiPicker.Viewport>
      </EmojiPicker.Root>
    </div>
  );
}
