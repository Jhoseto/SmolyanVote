import { CallWindowPageClient } from "./CallWindowPageClient";

export const metadata = {
  title: "Обаждане | SmolyanVote",
  robots: { index: false, follow: false },
};

/** Popup LiveKit call surface — opened by messenger `useCallController` (Фаза 8d). */
export default async function CallWindowPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  return (
    <CallWindowPageClient
      params={{
        token: pick("token"),
        roomName: pick("roomName"),
        serverUrl: pick("serverUrl"),
        conversationId: pick("conversationId"),
        otherUserName: pick("otherUserName"),
        otherUserAvatar: pick("otherUserAvatar"),
        callType: pick("callType") === "video" ? "video" : "voice",
        callState: pick("callState") === "connected" ? "connected" : "outgoing",
      }}
    />
  );
}
