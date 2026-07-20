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

export const messengerSounds = {
  playMessage(): void {
    playOnce(SOUND.message, 0.4);
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
