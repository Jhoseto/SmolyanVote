"use client";

import { useState } from "react";
import { Button } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { UploadEpisodeModal } from "./UploadEpisodeModal";

interface UploadEpisodeButtonProps {
  className?: string;
}

/** Admin-only "нов епизод" trigger — mirrors `EditEventButton`'s ADMIN-only gating. */
export function UploadEpisodeButton({ className }: UploadEpisodeButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user || user.role !== "ADMIN") return null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className={className}>
        <i className="bi bi-mic-fill" />
        Качи епизод
      </Button>
      <UploadEpisodeModal open={open} onOpenChange={setOpen} />
    </>
  );
}
