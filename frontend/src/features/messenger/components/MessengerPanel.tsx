"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { useIsDesktopMessenger } from "../lib/isDesktopMessenger";
import { panelVariants } from "../lib/messengerMotion";
import { cn } from "@/shared/lib/cn";
import { ConversationList } from "./ConversationList";
import { CallsList } from "./CallsList";
import { UserSearch } from "./UserSearch";
import { MessengerSettingsPanel } from "./MessengerSettingsPanel";

type PanelTab = "list" | "calls" | "search";

const TABS: { id: PanelTab; label: string; icon: string }[] = [
  { id: "list", label: "Чатове", icon: "bi-chat-dots" },
  { id: "calls", label: "Обаждания", icon: "bi-telephone" },
  { id: "search", label: "Търсене", icon: "bi-search" },
];

/** List/calls/search panel — chat windows are separate floating surfaces. */
export function MessengerPanel() {
  const panelOpen = useMessengerUiStore((s) => s.panelOpen);
  const panelView = useMessengerUiStore((s) => s.panelView);
  const closePanel = useMessengerUiStore((s) => s.closePanel);
  const showList = useMessengerUiStore((s) => s.showList);
  const showSearch = useMessengerUiStore((s) => s.showSearch);
  const showCalls = useMessengerUiStore((s) => s.showCalls);
  const isDesktop = useIsDesktopMessenger();
  const [settingsOpen, setSettingsOpen] = useState(false);

  function selectTab(tab: PanelTab) {
    if (tab === "list") showList();
    else if (tab === "search") showSearch();
    else showCalls();
  }

  return (
    <AnimatePresence>
      {panelOpen && isDesktop && (
        <motion.section
          key="messenger-panel"
          role="dialog"
          aria-label="Съобщения"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ transformOrigin: "bottom right" }}
          className={cn(
            "sv-msg-surface fixed z-[1070] flex flex-col overflow-hidden",
            "bottom-[var(--sv-rail-slot)] right-[var(--sv-rail-right)]",
            "h-[min(560px,calc(100vh-9rem))] w-[min(360px,calc(100vw-2rem))]",
          )}
          data-glass="on"
        >
          <header className="shrink-0">
            <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5">
              <h2 className="font-[family-name:var(--font-display)] text-[13.5px] font-bold tracking-[-0.01em] text-[color:var(--color-text-heading)]">
                Съобщения
              </h2>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={showSearch}
                  className="btn-brand flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold shadow-[0_2px_6px_rgba(25,134,28,0.28)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <i className="bi bi-pencil-square text-[11px]" aria-hidden />
                  Нов
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Настройки"
                  title="Настройки"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-white hover:text-[color:var(--color-primary)]"
                >
                  <i className="bi bi-sliders text-[12px]" />
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Затвори"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-white hover:text-[color:var(--color-error)]"
                >
                  <i className="bi bi-x-lg text-[12px]" />
                </button>
              </div>
            </div>

            <nav className="flex gap-0.5 px-2.5" aria-label="Раздели">
              {TABS.map((tab) => {
                const active = panelView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    aria-current={active}
                    className={cn(
                      "relative flex items-center gap-1 rounded-t-[6px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                      active
                        ? "text-[color:var(--color-primary)]"
                        : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-heading)]",
                    )}
                  >
                    <i className={cn("bi text-[11px]", tab.icon)} />
                    {tab.label}
                    {active && (
                      <motion.span
                        layoutId="sv-msg-tab-indicator"
                        className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[image:var(--gradient-primary)]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="sv-msg-brandline" aria-hidden />
          </header>

          <div className="min-h-0 flex-1">
            {panelView === "list" && <ConversationList />}
            {panelView === "calls" && <CallsList />}
            {panelView === "search" && <UserSearch />}
          </div>

          <MessengerSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </motion.section>
      )}
    </AnimatePresence>
  );
}
