"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { messengerApi } from "../api";
import { useCreateGroup } from "../hooks/useGroups";
import type { MessengerUser } from "../types";

const MAX_MEMBERS = 99;

interface CreateGroupDialogProps {
  onClose: () => void;
}

/** Name the group, pick members, done. Kept deliberately short — two fields. */
export function CreateGroupDialog({ onClose }: CreateGroupDialogProps) {
  const [title, setTitle] = useState("");
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<MessengerUser[]>([]);
  const query = useDebounce(input.trim(), 300);
  const createGroup = useCreateGroup();

  const following = useQuery({
    queryKey: ["messenger", "following-search", ""],
    queryFn: () => messengerApi.followingUsers(),
    staleTime: 30_000,
  });

  const search = useQuery({
    queryKey: ["messenger", "user-search", query],
    queryFn: () => messengerApi.searchUsers(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  const active = query.length >= 2 ? search : following;
  const selectedIds = useMemo(() => new Set(selected.map((u) => u.id)), [selected]);
  const results = (active.data ?? []).filter((u) => !selectedIds.has(u.id));

  const canSubmit = title.trim().length > 0 && selected.length > 0 && !createGroup.isPending;

  function toggle(user: MessengerUser) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : prev.length >= MAX_MEMBERS
          ? prev
          : [...prev, user],
    );
  }

  async function submit() {
    if (!canSubmit) return;
    await createGroup.mutateAsync({
      title: title.trim(),
      memberIds: selected.map((u) => u.id),
    });
    onClose();
  }

  return (
    <Dialog.Root open onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1101] flex items-center justify-center p-4 outline-none">
          <div
            className="sv-msg sv-msg-surface relative flex max-h-[76vh] w-full max-w-md flex-col overflow-hidden"
            data-glass="on"
          >
            <Dialog.Title className="flex items-center gap-2 px-4 pb-2 pt-3.5 text-sm font-semibold">
              <i className="bi bi-people-fill text-[color:var(--color-primary)]" aria-hidden />
              Нова група
            </Dialog.Title>

            <div className="space-y-2 px-4 pb-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                placeholder="Име на групата"
                aria-label="Име на групата"
                autoFocus
                className="w-full rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)]"
              />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Търси хора за добавяне…"
                aria-label="Търси участници"
                className="w-full rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[color:var(--color-primary)]"
              />
            </div>

            {selected.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 px-4 pb-2">
                {selected.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => toggle(user)}
                      className="flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-primary-50)] py-1 pl-1 pr-2 text-xs font-medium text-[color:var(--color-primary)]"
                    >
                      <Avatar username={user.username} imageUrl={user.imageUrl} size={20} />
                      {user.fullName || user.username}
                      <i className="bi bi-x-lg text-[10px]" aria-hidden />
                      <span className="sr-only">Премахни</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="sv-msg-brandline" aria-hidden />

            <ul className="sv-scrollbar min-h-0 flex-1 overflow-y-auto p-1.5">
              {active.isPending &&
                Array.from({ length: 4 }, (_, i) => (
                  <li key={i}>
                    <Skeleton className="mx-1.5 my-1 h-11 rounded-[var(--radius-md)]" />
                  </li>
                ))}

              {!active.isPending && results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
                  {query.length >= 2 ? "Няма резултати" : "Търси по име или потребителско име"}
                </li>
              )}

              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => toggle(user)}
                    className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left hover:bg-[color:var(--color-surface-light)]"
                  >
                    <Avatar username={user.username} imageUrl={user.imageUrl} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {user.fullName || user.username}
                      </span>
                      <span className="block truncate text-[11px] text-[color:var(--color-text-muted)]">
                        @{user.username}
                      </span>
                    </span>
                    <i className="bi bi-plus-circle shrink-0 opacity-40" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-2 border-t border-border-default/50 px-4 py-2.5">
              <span className="text-[11px] text-[color:var(--color-text-muted)]">
                {selected.length > 0 ? `${selected.length + 1} участници` : "Избери поне един човек"}
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-light)]"
                >
                  Отказ
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!canSubmit}
                  className={cn(
                    "rounded-[var(--radius-md)] bg-[image:var(--gradient-primary)] px-3.5 py-1.5 text-[13px] font-semibold text-white",
                    !canSubmit && "opacity-50",
                  )}
                >
                  Създай
                </button>
              </span>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
