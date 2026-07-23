import WaveSurfer from "wavesurfer.js";
import { getPodcastAudioElement } from "./podcastAudioController";

const SAMPLE_RATE = 8000;
const PEAK_LENGTH = 8000;

let waveSurfer: WaveSurfer | null = null;
let hiddenHost: HTMLDivElement | null = null;
let mountedContainer: HTMLElement | null = null;
let waveSurferHost: HTMLElement | null = null;
let decodedUrl: string | null = null;
let loadGeneration = 0;

export interface PodcastWaveformMountOptions {
  height: number;
  waveColor: string | CanvasGradient;
  progressColor: string | CanvasGradient;
  cursorColor: string;
  barWidth: number;
  barGap: number;
  barRadius: number;
}

function ensureHiddenHost(): HTMLDivElement {
  if (!hiddenHost) {
    hiddenHost = document.createElement("div");
    hiddenHost.setAttribute("aria-hidden", "true");
    hiddenHost.style.display = "none";
    document.body.appendChild(hiddenHost);
  }
  return hiddenHost;
}

function normalizeUrl(url: string): string {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

function mediaHasUrl(audio: HTMLAudioElement, url: string): boolean {
  const target = normalizeUrl(url);
  const current = audio.currentSrc || audio.src;
  return Boolean(current) && normalizeUrl(current) === target;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { name?: string; message?: string };
  return err.name === "AbortError" || /aborted/i.test(err.message ?? "");
}

function exportPeaksFromBuffer(audioBuffer: AudioBuffer, maxLength: number): number[][] {
  const length = audioBuffer.length;
  const channels = audioBuffer.numberOfChannels;
  const merged = new Float32Array(length);

  for (let c = 0; c < channels; c++) {
    const channel = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      merged[i] += (channel[i] ?? 0) / channels;
    }
  }

  const data: number[] = [];
  const sampleSize = merged.length / maxLength;

  for (let j = 0; j < maxLength; j++) {
    const start = Math.floor(j * sampleSize);
    const end = Math.ceil((j + 1) * sampleSize);
    let max = 0;
    for (let x = start; x < end; x++) {
      const value = merged[x] ?? 0;
      if (Math.abs(value) > Math.abs(max)) max = value;
    }
    data.push(Math.round(max * 10_000) / 10_000);
  }

  return [data];
}

function clearOrphanWaveformNodes(container: HTMLElement, keep: HTMLElement | null): void {
  for (const child of Array.from(container.children)) {
    if (child !== keep) {
      child.remove();
    }
  }
}

async function fetchPeaksFromUrl(url: string): Promise<number[][]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Waveform fetch failed: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    return exportPeaksFromBuffer(audioBuffer, PEAK_LENGTH);
  } finally {
    await audioCtx.close().catch(() => undefined);
  }
}

async function waitForMediaMetadata(audio: HTMLAudioElement, url: string): Promise<number> {
  if (mediaHasUrl(audio, url) && Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.duration;
  }

  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve(audio.duration || 0);
    };
    const onError = () => {
      cleanup();
      reject(new Error("Audio metadata failed to load"));
    };
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onReady);
      audio.removeEventListener("error", onError);
    };

    audio.addEventListener("loadedmetadata", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
  });
}

async function loadWaveform(url: string): Promise<void> {
  if (!waveSurfer) return;

  const generation = ++loadGeneration;
  const audio = getPodcastAudioElement();

  try {
    const duration = await waitForMediaMetadata(audio, url);
    if (generation !== loadGeneration) return;

    if (mediaHasUrl(audio, url)) {
      const peaks = await fetchPeaksFromUrl(url);
      if (generation !== loadGeneration) return;
      await waveSurfer.load(url, peaks, duration || undefined);
    } else {
      await waveSurfer.load(url);
    }

    if (generation === loadGeneration) {
      decodedUrl = url;
    }
  } catch (error) {
    if (!isAbortError(error)) {
      console.warn("[PodcastWaveform] load failed:", error);
    }
    if (generation === loadGeneration) {
      decodedUrl = null;
    }
  }
}

export function mountPodcastWaveform(
  container: HTMLElement,
  options: PodcastWaveformMountOptions,
): WaveSurfer {
  if (!waveSurfer) {
    clearOrphanWaveformNodes(container, null);
    waveSurfer = WaveSurfer.create({
      container,
      media: getPodcastAudioElement(),
      waveColor: options.waveColor,
      progressColor: options.progressColor,
      cursorColor: options.cursorColor,
      barWidth: options.barWidth,
      barGap: options.barGap,
      barRadius: options.barRadius,
      cursorWidth: 2,
      height: options.height,
      normalize: true,
      interact: true,
    });
    waveSurferHost = container.firstElementChild as HTMLElement | null;
    mountedContainer = container;
    return waveSurfer;
  }

  waveSurfer.setOptions({
    container,
    height: options.height,
    waveColor: options.waveColor,
    progressColor: options.progressColor,
    cursorColor: options.cursorColor,
    barWidth: options.barWidth,
    barGap: options.barGap,
    barRadius: options.barRadius,
  });

  waveSurferHost = container.querySelector(":scope > div") ?? waveSurferHost;
  clearOrphanWaveformNodes(container, waveSurferHost);
  mountedContainer = container;
  return waveSurfer;
}

export function unmountPodcastWaveform(container: HTMLElement): void {
  if (!waveSurfer || mountedContainer !== container) return;

  waveSurfer.setOptions({ container: ensureHiddenHost() });
  mountedContainer = null;
}

export function syncPodcastWaveform(url: string | undefined): void {
  if (!url) {
    decodedUrl = null;
    loadGeneration++;
    waveSurfer?.empty();
    return;
  }

  if (decodedUrl === url) return;
  void loadWaveform(url);
}

export function getPodcastWaveSurfer(): WaveSurfer | null {
  return waveSurfer;
}
