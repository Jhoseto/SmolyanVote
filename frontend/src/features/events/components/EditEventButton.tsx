"use client";

import Link from "next/link";
import { useAuth } from "@/shared/lib/authContext";

interface EditEventButtonProps {
  href: string;
  className?: string;
}

/** Admin-only "Редактирай" link — visible only to ADMIN, mirrors the ADMIN-only backend PUT endpoints. */
export function EditEventButton({ href, className }: EditEventButtonProps) {
  const { user } = useAuth();

  if (!user || user.role !== "ADMIN") return null;

  return (
    <Link
      href={href}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm text-[color:var(--color-text-muted)] hover:text-primary"
      }
    >
      <i className="bi bi-pencil-square" />
      Редактирай
    </Link>
  );
}
