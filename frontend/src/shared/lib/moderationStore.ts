import { create } from "zustand";

export type ModerationViolationType = "PROFANITY" | "IMAGE" | "SPAM";

export interface ModerationWarningOptions {
  title: string;
  message: string;
  violationType?: ModerationViolationType;
  strikeCount?: number;
  strikesUntilBan?: number;
  autoBanned?: boolean;
  banEndDate?: string | null;
}

export interface PermanentBanOptions {
  banReason: string | null;
}

interface ModerationState {
  warning: ModerationWarningOptions | null;
  permanentBan: PermanentBanOptions | null;
  showWarning: (options: ModerationWarningOptions) => void;
  dismissWarning: () => void;
  showPermanentBan: (options: PermanentBanOptions) => void;
  dismissPermanentBan: () => void;
}

export const useModerationStore = create<ModerationState>((set) => ({
  warning: null,
  permanentBan: null,
  showWarning: (options) => set({ warning: options }),
  dismissWarning: () => set({ warning: null }),
  showPermanentBan: (options) => set({ permanentBan: options }),
  dismissPermanentBan: () => set({ permanentBan: null }),
}));

export interface ModerationErrorBody {
  code?: string;
  message?: string;
  violationType?: ModerationViolationType;
  strikeCount?: number;
  strikesUntilBan?: number;
  autoBanned?: boolean;
  banEndDate?: string;
  banReason?: string;
  permanent?: boolean;
}

export function notifyModerationFromApiBody(body: unknown): void {
  if (!body || typeof body !== "object") return;
  const b = body as ModerationErrorBody;
  const code = b.code;

  if (code === "PERMANENT_BAN") {
    useModerationStore.getState().showPermanentBan({
      banReason: b.banReason ?? b.message ?? null,
    });
    return;
  }

  if (code === "MODERATION_VIOLATION" || code === "MODERATION_AUTO_BAN") {
    const autoBanned = code === "MODERATION_AUTO_BAN" || Boolean(b.autoBanned);
    useModerationStore.getState().showWarning({
      title: autoBanned ? "Профилът е временно ограничен" : "Предупреждение за поведение",
      message: b.message ?? "Действието не може да бъде изпълнено.",
      violationType: b.violationType,
      strikeCount: b.strikeCount,
      strikesUntilBan: b.strikesUntilBan,
      autoBanned,
      banEndDate: b.banEndDate ?? null,
    });
    return;
  }

  if (code === "USER_BANNED") {
    useModerationStore.getState().showWarning({
      title: b.permanent ? "Профилът е блокиран" : "Профилът е временно ограничен",
      message:
        b.message ??
        "Можете само да разглеждате съдържание. Взаимодействията са изключени.",
      autoBanned: !b.permanent,
      banEndDate: b.banEndDate ?? null,
    });
  }
}

export function showReadOnlyWarning(user: {
  banReason?: string | null;
  banEndDate?: string | null;
} | null | undefined): void {
  useModerationStore.getState().showWarning({
    title: "Профилът е временно ограничен",
    message: user?.banReason
      ? `${user.banReason} Можете само да разглеждате съдържание — взаимодействията са изключени.`
      : "Докато профилът ви е ограничен, можете само да разглеждате. Взаимодействията са изключени.",
    autoBanned: true,
    banEndDate: user?.banEndDate ?? null,
  });
}
