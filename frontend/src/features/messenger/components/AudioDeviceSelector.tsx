"use client";

import { useEffect, useState } from "react";
import { LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { loadDeviceSettings, saveDeviceSettings } from "../lib/deviceSettings";

interface AudioDeviceSelectorProps {
  open: boolean;
  mode: "call" | "settings";
  onComplete: () => void;
  onCancel: () => void;
}

interface DeviceLists {
  mics: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
  cameras: MediaDeviceInfo[];
}

async function enumerate(): Promise<DeviceLists> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      /* continue with listed devices */
    }
  }

  const all = await navigator.mediaDevices.enumerateDevices();
  return {
    mics: all.filter((d) => d.kind === "audioinput"),
    speakers: all.filter((d) => d.kind === "audiooutput"),
    cameras: all.filter((d) => d.kind === "videoinput"),
  };
}

/** Device picker before first call / from settings (Фаза 8d). */
export function AudioDeviceSelector({ open, mode, onComplete, onCancel }: AudioDeviceSelectorProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4">
      <DeviceSelectorBody mode={mode} onComplete={onComplete} onCancel={onCancel} />
    </div>
  );
}

function DeviceSelectorBody({
  mode,
  onComplete,
  onCancel,
}: {
  mode: "call" | "settings";
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mic, setMic] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [camera, setCamera] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void enumerate()
      .then((lists) => {
        if (cancelled) return;
        setMics(lists.mics);
        setSpeakers(lists.speakers);
        setCameras(lists.cameras);
        const saved = loadDeviceSettings();
        setMic(saved?.microphone || lists.mics[0]?.deviceId || "");
        setSpeaker(saved?.speaker || lists.speakers[0]?.deviceId || "");
        setCamera(saved?.camera || lists.cameras[0]?.deviceId || "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Не можахме да заредим устройствата. Проверете разрешенията.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function save() {
    if (!mic || !speaker) {
      setError("Изберете микрофон и високоговорител.");
      return;
    }
    saveDeviceSettings({ microphone: mic, speaker, camera });
    onComplete();
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-border-default/60 bg-white shadow-[var(--shadow-dropdown)]">
      <div className="flex items-center justify-between border-b border-border-default/60 bg-[color:var(--color-surface-muted)] px-4 py-3">
        <h3 className="text-sm font-bold text-[color:var(--color-text-heading)]">
          {mode === "settings" ? "Настройки на устройства" : "Избор на устройства"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Затвори"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-white"
        >
          <i className="bi bi-x-lg text-sm" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        {loading && (
          <div className="flex justify-center py-2">
            <LogoLoader size="sm" label="Зареждане…" />
          </div>
        )}
        {error && <p className="text-sm text-[color:var(--color-error)]">{error}</p>}

        {!loading && (
          <>
            <DeviceSelect label="Микрофон" icon="bi-mic" value={mic} onChange={setMic} options={mics} />
            <DeviceSelect
              label="Високоговорител"
              icon="bi-volume-up"
              value={speaker}
              onChange={setSpeaker}
              options={speakers}
            />
            <DeviceSelect
              label="Камера"
              icon="bi-camera-video"
              value={camera}
              onChange={setCamera}
              options={cameras}
            />
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border-default/60 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-muted)]"
        >
          Отказ
        </button>
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className={cn(
            "rounded-[var(--radius-md)] bg-[image:var(--gradient-primary)] px-4 py-1.5 text-sm font-medium text-white",
            loading && "opacity-50",
          )}
        >
          {mode === "call" ? "Продължи" : "Запази"}
        </button>
      </div>
    </div>
  );
}

function DeviceSelect({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  options: MediaDeviceInfo[];
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-text-secondary)]">
        <i className={cn("bi", icon)} />
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius-md)] border border-border-default/60 px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {options.length === 0 && <option value="">Няма налични устройства</option>}
        {options.map((d, i) => (
          <option key={d.deviceId || i} value={d.deviceId}>
            {d.label || `${label} ${i + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
}
