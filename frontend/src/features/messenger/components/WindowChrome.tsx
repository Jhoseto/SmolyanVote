"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { presenceLabel } from "../lib/presence";
import { GroupAvatar } from "./GroupAvatar";
import type { MessengerUser } from "../types";

interface WindowChromeProps {
  user: MessengerUser | undefined;
  /** Set for group chats — replaces the peer identity in the title bar. */
  group?: { title: string; imageUrl: string | null; members: MessengerUser[]; subtitle: string };
  online: boolean;
  typing: boolean;
  focused: boolean;
  maximized: boolean;
  searchOpen: boolean;
  sidebarOpen: boolean;
  muted?: boolean;
  onToggleMute?: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
  onToggleSearch: () => void;
  onToggleSidebar: () => void;
  onStartCall?: (isVideo: boolean) => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

function ChromeButton({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-active={active ? "true" : "false"}
      data-danger={danger ? "true" : "false"}
      className="sv-msg-chrome-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <i className={cn("bi", icon, "text-[11.5px]")} />
    </button>
  );
}

/** Title bar: identity on the left, window + conversation controls on the right. */
export function WindowChrome({
  user,
  group,
  online,
  typing,
  focused,
  maximized,
  searchOpen,
  sidebarOpen,
  muted = false,
  onToggleMute,
  onPointerDown,
  onDoubleClick,
  onToggleSearch,
  onToggleSidebar,
  onStartCall,
  onMinimize,
  onToggleMaximize,
  onClose,
}: WindowChromeProps) {
  return (
    <div className="shrink-0">
      <div
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        data-focused={focused}
        className="sv-msg-chrome flex cursor-grab items-center gap-2 px-2 py-1.5 text-white active:cursor-grabbing"
      >
        <div className="relative shrink-0">
          {group ? (
            <GroupAvatar
              title={group.title}
              imageUrl={group.imageUrl}
              members={group.members}
              size={26}
            />
          ) : (
            <>
              <Avatar username={user?.username ?? "?"} imageUrl={user?.imageUrl ?? null} size={26} />
              <span
                className={cn(
                  "absolute -bottom-px -right-px h-2 w-2 rounded-full border-[1.5px] border-white",
                  online ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-text-muted)]",
                )}
              />
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-display)] text-[12.5px] font-semibold leading-tight tracking-[-0.01em]">
            {group ? group.title : user?.fullName || user?.username || "Чат"}
          </p>
          <p className="truncate text-[10px] leading-tight text-white/70">
            {group
              ? typing
                ? "някой пише…"
                : group.subtitle
              : presenceLabel({ online, typing, lastSeen: user?.lastSeen })}
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <ChromeButton
            icon="bi-search"
            label="Търсене в разговора"
            active={searchOpen}
            onClick={onToggleSearch}
          />
          {onStartCall && (
            <>
              <ChromeButton
                icon="bi-telephone"
                label="Аудио обаждане"
                onClick={() => onStartCall(false)}
              />
              <ChromeButton
                icon="bi-camera-video"
                label="Видео обаждане"
                onClick={() => onStartCall(true)}
              />
            </>
          )}
          {onToggleMute && (
            <ChromeButton
              icon={muted ? "bi-bell-slash-fill" : "bi-bell"}
              label={muted ? "Включи известията" : "Заглуши разговора"}
              active={muted}
              onClick={onToggleMute}
            />
          )}
          <ChromeButton
            icon="bi-info-circle"
            label="Информация за разговора"
            active={sidebarOpen}
            onClick={onToggleSidebar}
          />
          <span className="mx-1 h-3.5 w-px bg-white/25" aria-hidden />
          <ChromeButton icon="bi-dash-lg" label="Минимизирай" onClick={onMinimize} />
          <ChromeButton
            icon={maximized ? "bi-fullscreen-exit" : "bi-arrows-fullscreen"}
            label={maximized ? "Изход от цял екран" : "Цял екран"}
            active={maximized}
            onClick={onToggleMaximize}
          />
          <ChromeButton icon="bi-x-lg" label="Затвори" danger onClick={onClose} />
        </div>
      </div>
      <div className="sv-msg-brandline" aria-hidden />
    </div>
  );
}
