"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";

const MAX_SECONDS = 180;
const BAR_COUNT = 32;

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Press-to-record voice note with a live waveform. Slide the cancel button or
 * hit Escape to discard; the recorded blob is handed back as a `File`.
 */
export function VoiceRecorder({
  onFinish,
  onCancel,
}: {
  onFinish: (file: File) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const cancelledRef = useRef(false);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array<number>(BAR_COUNT).fill(0.08));

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    cancelAnimationFrame(rafRef.current);
  }, []);

  const discard = useCallback(() => {
    cancelledRef.current = true;
    stop();
    onCancel();
  }, [stop, onCancel]);

  useEffect(() => {
    let stopped = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          if (cancelledRef.current) return;
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          if (blob.size === 0) return;
          onFinish(
            new File([blob], `voice-${Date.now()}.webm`, { type: blob.type }),
          );
        };
        recorder.start();

        const context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (const value of data) peak = Math.max(peak, Math.abs(value - 128) / 128);
          setLevels((prev) => [...prev.slice(1), Math.max(0.08, Math.min(1, peak * 1.8))]);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => void context.close();
      } catch {
        toast.error("Няма достъп до микрофона.");
        onCancel();
      }
    }

    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // Recording is started once per mount on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stop();
        return s + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stop]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") discard();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [discard]);

  return (
    <div className="flex h-10 flex-1 items-center gap-2.5 rounded-[var(--radius-lg)] border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/5 px-3">
      <motion.span
        aria-hidden
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-error)]"
      />
      <span className="sv-msg-num shrink-0 text-[11px] font-semibold text-[color:var(--color-error)]">
        {clock(seconds)}
      </span>

      <span className="flex h-6 min-w-0 flex-1 items-center gap-[2px] overflow-hidden" aria-hidden>
        {levels.map((level, index) => (
          <span
            key={index}
            style={{ height: `${Math.round(level * 100)}%` }}
            className="w-[2px] shrink-0 rounded-full bg-[color:var(--color-primary)]/70"
          />
        ))}
      </span>

      <button
        type="button"
        onClick={discard}
        aria-label="Откажи записа"
        className="shrink-0 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
      >
        <i className="bi bi-trash" />
      </button>
      <button
        type="button"
        onClick={stop}
        aria-label="Изпрати гласовото съобщение"
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          "bg-[image:var(--gradient-primary)] text-white",
        )}
      >
        <i className="bi bi-send-fill text-[11px]" />
      </button>
    </div>
  );
}
