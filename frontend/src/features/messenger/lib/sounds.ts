import {
  useMessengerPrefsStore,
  type MessengerSoundTheme,
} from "../store/messengerPrefsStore";

const SOUND = {
  incoming: "/svmessenger/sounds/IncomingCall.mp3",
  outgoing: "/svmessenger/sounds/OutCall.mp3",
  message: "/svmessenger/sounds/s1.mp3",
} as const;

let incomingEl: HTMLAudioElement | null = null;
let outgoingEl: HTMLAudioElement | null = null;

function playOnce(src: string, volume = 0.5): void {
  if (typeof window === "undefined") return;
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {
    /* autoplay may be blocked — explicit user gesture required later */
  });
}

/** Two soft sine blips — the "subtle" theme, synthesised so it ships no asset. */
function playBlip(): void {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;

  try {
    const context = new Ctor();
    const now = context.currentTime;
    for (const [index, frequency] of [880, 1320].entries()) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      const start = now + index * 0.07;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    }
    window.setTimeout(() => void context.close(), 400);
  } catch {
    /* audio unavailable — stay silent */
  }
}

export const messengerSounds = {
  /** Honours the user's sound theme; `off` plays nothing at all. */
  playMessage(): void {
    const theme = useMessengerPrefsStore.getState().soundTheme;
    if (theme === "off") return;
    if (theme === "subtle") {
      playBlip();
      return;
    }
    playOnce(SOUND.message, 0.4);
  },

  /** Preview used by the settings panel. */
  preview(theme: MessengerSoundTheme): void {
    if (theme === "off") return;
    if (theme === "subtle") playBlip();
    else playOnce(SOUND.message, 0.4);
  },

  startIncomingLoop(): void {
    if (typeof window === "undefined") return;
    if (!incomingEl) {
      incomingEl = new Audio(SOUND.incoming);
      incomingEl.loop = true;
      incomingEl.volume = 0.6;
    }
    void incomingEl.play().catch(() => {});
  },

  stopIncomingLoop(): void {
    if (!incomingEl) return;
    incomingEl.pause();
    incomingEl.currentTime = 0;
  },

  startOutgoingLoop(): void {
    if (typeof window === "undefined") return;
    if (!outgoingEl) {
      outgoingEl = new Audio(SOUND.outgoing);
      outgoingEl.loop = true;
      outgoingEl.volume = 0.5;
    }
    void outgoingEl.play().catch(() => {});
  },

  stopOutgoingLoop(): void {
    if (!outgoingEl) return;
    outgoingEl.pause();
    outgoingEl.currentTime = 0;
  },

  stopAll(): void {
    messengerSounds.stopIncomingLoop();
    messengerSounds.stopOutgoingLoop();
  },
};

export function notifyBrowser(title: string, body: string, tag?: string): void {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (document.visibilityState === "visible") return;

  function show() {
    try {
      new Notification(title, { body, tag, icon: "/images/logoNew.png" });
    } catch {
      /* ignore */
    }
  }

  if (Notification.permission === "granted") show();
  else if (Notification.permission !== "denied") {
    void Notification.requestPermission().then((p) => {
      if (p === "granted") show();
    });
  }
}
