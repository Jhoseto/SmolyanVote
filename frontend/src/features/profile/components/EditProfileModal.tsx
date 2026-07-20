"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button, ImageDropzone } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { LOCATION_OPTIONS } from "../lib/locations";
import type { PublicProfile } from "../types";

const BIO_MAX_LENGTH = 240;

interface EditProfileModalProps {
  profile: PublicProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** AJAX port of legacy `/profile/update/ajax` modal (bio + location + avatar file preview). */
export function EditProfileModal({ profile, open, onOpenChange }: EditProfileModalProps) {
  const toast = useToast();
  const { mutate, isPending } = useUpdateProfile();

  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "NONE");
  const [avatar, setAvatar] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    mutate(
      { bio, location, avatar: avatar[0] },
      {
        onSuccess: () => {
          toast.success("Профилът е обновен успешно");
          onOpenChange(false);
          setAvatar([]);
        },
        onError: (err) => toast.error(errorMessage(err, "Грешка при обновяване на профила")),
      },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/40 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-center justify-center p-4 outline-none">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[480px] rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
          >
            <Dialog.Title className="text-lg font-bold text-[color:var(--color-text-heading)]">
              Редактирай профила
            </Dialog.Title>

            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-secondary)]">
                  Профилна снимка
                </label>
                <ImageDropzone files={avatar} onChange={setAvatar} maxFiles={1} onError={setError} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-secondary)]">
                  Биография
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
                  rows={3}
                  placeholder="Разкажи нещо за себе си…"
                  className="w-full resize-none rounded-[var(--radius-md)] border border-border-default/60 p-3 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-right text-xs text-[color:var(--color-text-muted)]">
                  {bio.length}/{BIO_MAX_LENGTH}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-secondary)]">
                  Населено място
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full rounded-[var(--radius-md)] border border-border-default/60 p-2.5 text-sm outline-none focus:border-primary"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-[color:var(--color-error)]">{error}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close
                render={
                  <Button type="button" variant="outline" size="sm">
                    Отказ
                  </Button>
                }
              />
              <Button type="submit" size="sm" disabled={isPending}>
                Запази
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
