"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
  type LocalAudioTrack,
  type LocalVideoTrack,
  type RemoteTrack,
} from "livekit-client";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { env } from "@/config/env";
import { loadDeviceSettings } from "../lib/deviceSettings";

const CALL_CHANNEL = "svmessenger-call";

export interface CallWindowParams {
  token: string;
  roomName: string;
  serverUrl: string;
  conversationId: string;
  otherUserName: string;
  otherUserAvatar: string;
  callType: "video" | "voice";
  callState: "outgoing" | "connected";
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** LiveKit room UI for `/call-window` popup (Фаза 8d). */
export function CallWindowClient({ params }: { params: CallWindowParams }) {
  const otherName = decodeParam(params.otherUserName) || "Потребител";
  const otherAvatar = decodeParam(params.otherUserAvatar) || null;
  const isVideoCall = params.callType === "video";

  const [status, setStatus] = useState<"connecting" | "connected" | "ended">(
    params.callState === "connected" ? "connecting" : "connecting",
  );
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(isVideoCall);
  const [remoteVideo, setRemoteVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const audioTrackRef = useRef<LocalAudioTrack | null>(null);
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);
  const localVideoEl = useRef<HTMLVideoElement>(null);
  const remoteVideoEl = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);

  const endCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (durationRef.current) clearInterval(durationRef.current);
    channelRef.current?.postMessage({ type: "CALL_ENDED_FROM_POPUP" });
    try {
      await videoTrackRef.current?.stop();
      await audioTrackRef.current?.stop();
      await roomRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    setStatus("ended");
    window.close();
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CALL_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (ev: MessageEvent<{ type: string }>) => {
      if (ev.data?.type === "CLOSE_POPUP" || ev.data?.type === "CALL_ENDED") {
        void endCall();
      } else if (ev.data?.type === "CALL_ACCEPTED") {
        setStatus("connected");
      }
    };
    return () => channel.close();
  }, [endCall]);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const settings = loadDeviceSettings();
      const serverUrl = params.serverUrl || env.NEXT_PUBLIC_LIVEKIT_URL;
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        if (cancelled) return;
        setStatus("connected");
        channelRef.current?.postMessage({ type: "CALL_START_TIME" });
        if (!durationRef.current) {
          durationRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        if (participant.isLocal) return;
        if (track.kind === Track.Kind.Audio) {
          const el = (track as RemoteTrack).attach();
          el.dataset.identity = participant.identity;
          document.body.appendChild(el);
          // Apply speaker output if supported
          if (settings?.speaker && "setSinkId" in el) {
            void (el as HTMLMediaElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(
              settings.speaker,
            );
          }
        } else if (track.kind === Track.Kind.Video && remoteVideoEl.current) {
          track.attach(remoteVideoEl.current);
          setRemoteVideo(true);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
        if (track.kind === Track.Kind.Video) setRemoteVideo(false);
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        void endCall();
      });

      try {
        await room.connect(serverUrl, params.token);

        const audio = await createLocalAudioTrack(
          settings?.microphone ? { deviceId: settings.microphone } : undefined,
        );
        audioTrackRef.current = audio;
        await room.localParticipant.publishTrack(audio);

        if (isVideoCall) {
          try {
            const video = await createLocalVideoTrack(
              settings?.camera ? { deviceId: settings.camera } : undefined,
            );
            videoTrackRef.current = video;
            if (localVideoEl.current) video.attach(localVideoEl.current);
            await room.localParticipant.publishTrack(video);
            setCameraOn(true);
          } catch {
            setCameraOn(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Неуспешно свързване");
          setStatus("ended");
        }
      }
    }

    void connect();

    return () => {
      cancelled = true;
      if (durationRef.current) clearInterval(durationRef.current);
      void roomRef.current?.disconnect();
    };
  }, [params.token, params.serverUrl, isVideoCall, endCall]);

  async function toggleMute() {
    const track = audioTrackRef.current;
    if (!track) return;
    if (muted) {
      await track.unmute();
      setMuted(false);
    } else {
      await track.mute();
      setMuted(true);
    }
  }

  async function toggleCamera() {
    const room = roomRef.current;
    if (!room) return;
    if (cameraOn && videoTrackRef.current) {
      await room.localParticipant.unpublishTrack(videoTrackRef.current);
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
      setCameraOn(false);
      return;
    }
    try {
      const settings = loadDeviceSettings();
      const video = await createLocalVideoTrack(
        settings?.camera ? { deviceId: settings.camera } : undefined,
      );
      videoTrackRef.current = video;
      if (localVideoEl.current) video.attach(localVideoEl.current);
      await room.localParticipant.publishTrack(video);
      setCameraOn(true);
    } catch {
      setCameraOn(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0f1419] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <video
          ref={remoteVideoEl}
          autoPlay
          playsInline
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            remoteVideo ? "opacity-100" : "opacity-0",
          )}
        />

        {!remoteVideo && (
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Avatar username={otherName} imageUrl={otherAvatar} size={96} />
            <h1 className="text-xl font-bold">{otherName}</h1>
            <p className="text-sm text-white/70">
              {error
                ? error
                : status === "ended"
                  ? "Разговорът приключи"
                  : status === "connected"
                    ? formatDuration(duration)
                    : "Свързване…"}
            </p>
          </div>
        )}

        {remoteVideo && (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-black/50 px-3 py-1 text-sm">
            {otherName} · {formatDuration(duration)}
          </div>
        )}

        {cameraOn && (
          <video
            ref={localVideoEl}
            autoPlay
            playsInline
            muted
            className="absolute bottom-28 right-4 z-10 h-36 w-28 rounded-lg border border-white/20 object-cover shadow-lg"
          />
        )}
      </div>

      <div className="relative z-10 flex items-center justify-center gap-4 pb-10">
        <button
          type="button"
          onClick={() => void toggleMute()}
          aria-label={muted ? "Включи микрофон" : "Изключи микрофон"}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full text-xl",
            muted ? "bg-white text-[#0f1419]" : "bg-white/15 text-white hover:bg-white/25",
          )}
        >
          <i className={cn("bi", muted ? "bi-mic-mute-fill" : "bi-mic-fill")} />
        </button>

        {isVideoCall && (
          <button
            type="button"
            onClick={() => void toggleCamera()}
            aria-label={cameraOn ? "Изключи камера" : "Включи камера"}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-xl",
              !cameraOn ? "bg-white text-[#0f1419]" : "bg-white/15 text-white hover:bg-white/25",
            )}
          >
            <i className={cn("bi", cameraOn ? "bi-camera-video-fill" : "bi-camera-video-off-fill")} />
          </button>
        )}

        <button
          type="button"
          onClick={() => void endCall()}
          aria-label="Прекрати"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-error)] text-xl text-white"
        >
          <i className="bi bi-telephone-x-fill" />
        </button>
      </div>
    </div>
  );
}
