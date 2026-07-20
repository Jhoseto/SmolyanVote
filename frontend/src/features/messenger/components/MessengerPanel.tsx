"use client";

import { useMessengerUiStore } from "../store/messengerUiStore";
import { ConversationList } from "./ConversationList";
import { UserSearch } from "./UserSearch";

/** List/search panel — chat windows are separate floating surfaces (Фаза 8b). */
export function MessengerPanel() {
  const panelOpen = useMessengerUiStore((s) => s.panelOpen);
  const panelView = useMessengerUiStore((s) => s.panelView);
  const closePanel = useMessengerUiStore((s) => s.closePanel);

  if (!panelOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[1070] flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border-default/60 bg-white shadow-[var(--shadow-dropdown)]">
      <div className="flex items-center justify-between border-b border-border-default/60 bg-[color:var(--color-surface-muted)] px-4 py-2.5">
        <h2 className="text-sm font-bold text-[color:var(--color-text-heading)]">Съобщения</h2>
        <button
          type="button"
          onClick={closePanel}
          aria-label="Затвори"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-white hover:text-[color:var(--color-error)]"
        >
          <i className="bi bi-x-lg text-sm" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {panelView === "list" && <ConversationList />}
        {panelView === "search" && <UserSearch />}
      </div>
    </div>
  );
}
