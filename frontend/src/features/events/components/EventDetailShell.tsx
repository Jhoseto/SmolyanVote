import type { ReactNode } from "react";
import Link from "next/link";
import { Avatar, Card, Container } from "@/shared/ui";import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { locationLabel } from "../data/locations";
import { EVENT_TYPE_ICON, EVENT_TYPE_LABEL } from "../lib/eventLinks";
import type { BackendEventType } from "../types";
import { EventGallery } from "./EventGallery";

interface EventDetailShellProps {
  eventType: BackendEventType;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  viewCounter: number;
  creatorName: string;
  creatorImage: string | null;
  images: string[];
  /** Voting UI — composed at the `app/` layer (features never import features). */
  voteSlot: ReactNode;
  /** "Докладвай" + share — composed at the `app/` layer. */
  actionsSlot: ReactNode;
  /** Comments section — composed at the `app/` layer. */
  commentsSlot: ReactNode;
}

/** Shared layout for the 3 event detail pages — data + composition only, no domain logic of its own. */
export function EventDetailShell(props: EventDetailShellProps) {
  const location = locationLabel(props.location);

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div>
          <span
            className={cn(
              "mb-3 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary-50 px-3 py-1 text-xs font-semibold text-primary",
            )}
          >
            <i className={cn("bi", EVENT_TYPE_ICON[props.eventType])} />
            {EVENT_TYPE_LABEL[props.eventType]}
          </span>
          <h1 className="text-2xl font-bold leading-tight text-[color:var(--color-text-heading)] sm:text-3xl">
            {props.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar username={props.creatorName} imageUrl={props.creatorImage} size={32} />
              <span className="text-sm font-medium text-[color:var(--color-text-primary)]">{props.creatorName}</span>
            </div>
            <span className="text-sm text-[color:var(--color-text-muted)]">
              {formatRelativeDate(props.createdAt)}
            </span>
            {location && (
              <span className="flex items-center gap-1 text-sm text-[color:var(--color-text-muted)]">
                <i className="bi bi-geo-alt-fill" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-[color:var(--color-text-muted)]">
              <i className="bi bi-eye-fill" />
              {props.viewCounter}
            </span>
          </div>
        </div>

        <div className="flex lg:items-end lg:justify-end">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-700 hover:underline"
          >
            <i className="bi bi-arrow-left" aria-hidden />
            Към всички събития
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <EventGallery images={props.images} title={props.title} />

          <p className="whitespace-pre-wrap text-[color:var(--color-text-secondary)]">{props.description}</p>

          <div className="flex items-center gap-4 border-t border-border-default/60 pt-4">{props.actionsSlot}</div>
        </div>

        <div>
          <Card className="overflow-hidden border-primary/10 p-0 shadow-[0_16px_40px_-24px_rgba(25,134,28,0.35)]">
            <div className="border-b border-primary/10 bg-gradient-to-br from-primary-50/90 via-white to-white px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-white shadow-[0_8px_18px_-10px_rgba(25,134,28,0.75)]">
                  <i className="bi bi-check2-square text-[1.05rem]" />
                </span>
                <div>
                  <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em] text-[color:var(--color-text-heading)]">
                    Гласуване
                  </h2>
                  <p className="font-sans text-[0.75rem] font-light text-[color:var(--color-text-muted)]">
                    Резултатите се обновяват на живо
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">{props.voteSlot}</div>
          </Card>
        </div>
      </div>

      <Card className="p-5 sm:p-6">{props.commentsSlot}</Card>
    </Container>
  );
}
