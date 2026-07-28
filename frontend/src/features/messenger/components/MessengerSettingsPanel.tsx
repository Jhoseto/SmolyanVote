"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { easeOutExpo } from "../lib/messengerMotion";
import { messengerSounds } from "../lib/sounds";
import {
  useMessengerPrefsStore,
  type MessengerDensity,
  type MessengerSoundTheme,
} from "../store/messengerPrefsStore";

const DENSITIES: { value: MessengerDensity; label: string; hint: string }[] = [
  { value: "compact", label: "Компактна", hint: "Повече съобщения на екран" },
  { value: "comfortable", label: "Нормална", hint: "Балансирана" },
  { value: "spacious", label: "Просторна", hint: "Повече въздух" },
];

const SOUND_THEMES: { value: MessengerSoundTheme; label: string }[] = [
  { value: "subtle", label: "Дискретна" },
  { value: "classic", label: "Класическа" },
  { value: "off", label: "Изключена" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <span className="sv-msg-label">{title}</span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-1.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{label}</span>
        {hint && (
          <span className="block text-[11px] text-[color:var(--color-text-muted)]">{hint}</span>
        )}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-[color:var(--color-primary)]" : "bg-[color:var(--color-border-default)]",
        )}
      >
        <motion.span
          layout
          transition={{ duration: 0.18, ease: easeOutExpo }}
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-[var(--shadow-xs)]",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

/** Slide-over with desktop-only personalisation, opened from the panel header. */
export function MessengerSettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const density = useMessengerPrefsStore((s) => s.density);
  const setDensity = useMessengerPrefsStore((s) => s.setDensity);
  const soundTheme = useMessengerPrefsStore((s) => s.soundTheme);
  const setSoundTheme = useMessengerPrefsStore((s) => s.setSoundTheme);
  const enterToSend = useMessengerPrefsStore((s) => s.enterToSend);
  const setEnterToSend = useMessengerPrefsStore((s) => s.setEnterToSend);
  const showReadReceipts = useMessengerPrefsStore((s) => s.showReadReceipts);
  const setShowReadReceipts = useMessengerPrefsStore((s) => s.setShowReadReceipts);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.24, ease: easeOutExpo }}
          className="absolute inset-0 z-20 flex flex-col bg-white/95 backdrop-blur-xl"
          data-overlay
          role="dialog"
          aria-label="Настройки на съобщенията"
        >
          <div className="flex shrink-0 items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Назад"
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[color:var(--color-surface-light)]"
            >
              <i className="bi bi-arrow-left" />
            </button>
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold">
              Настройки
            </p>
          </div>
          <div className="sv-msg-brandline" aria-hidden />

          <div className="sv-scrollbar min-h-0 flex-1 divide-y divide-border-default/40 overflow-y-auto">
            <Section title="Плътност">
              <div className="grid grid-cols-3 gap-1.5">
                {DENSITIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDensity(option.value)}
                    title={option.hint}
                    className={cn(
                      "rounded-[var(--radius-md)] border px-2 py-2 text-[12px] font-medium transition-colors",
                      density === option.value
                        ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-50)] text-[color:var(--color-primary)]"
                        : "border-border-default/60 hover:bg-[color:var(--color-surface-light)]",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Звук">
              <div className="grid grid-cols-3 gap-1.5">
                {SOUND_THEMES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSoundTheme(option.value);
                      messengerSounds.preview(option.value);
                    }}
                    className={cn(
                      "rounded-[var(--radius-md)] border px-2 py-2 text-[12px] font-medium transition-colors",
                      soundTheme === option.value
                        ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-50)] text-[color:var(--color-primary)]"
                        : "border-border-default/60 hover:bg-[color:var(--color-surface-light)]",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Писане">
              <Toggle
                label="Enter изпраща"
                hint={enterToSend ? "Shift+Enter за нов ред" : "Ctrl+Enter изпраща"}
                checked={enterToSend}
                onChange={setEnterToSend}
              />
              <Toggle
                label="Показвай разписки за прочитане"
                checked={showReadReceipts}
                onChange={setShowReadReceipts}
              />
            </Section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
