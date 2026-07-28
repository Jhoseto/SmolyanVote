/**
 * Feature-to-feature bridge for "Изпрати в чат". Publications, signals and
 * events dispatch the request; the messenger listens and opens its picker.
 * A DOM event keeps the two features decoupled (features never import features).
 */
export const SHARE_TO_CHAT_EVENT = "sv:share-to-chat";

export interface ShareToChatPayload {
  /** Absolute or app-relative URL of the entity being shared. */
  url: string;
  title?: string;
}

export function shareToChat(payload: ShareToChatPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ShareToChatPayload>(SHARE_TO_CHAT_EVENT, { detail: payload }));
}

export function onShareToChat(handler: (payload: ShareToChatPayload) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => handler((event as CustomEvent<ShareToChatPayload>).detail);
  window.addEventListener(SHARE_TO_CHAT_EVENT, listener);
  return () => window.removeEventListener(SHARE_TO_CHAT_EVENT, listener);
}
