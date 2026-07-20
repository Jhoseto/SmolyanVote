import Link from "next/link";
import { Card } from "@/shared/ui";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import type { ProfilePublicationItem } from "../types";

export function ProfilePublicationCard({ publication }: { publication: ProfilePublicationItem }) {
  return (
    <Link href={`/publications?openModal=${publication.id}`} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]">
        {publication.imageUrl && (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--color-surface-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs */}
            <img src={publication.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="line-clamp-2 text-sm font-semibold text-[color:var(--color-text-heading)]">
            {publication.title}
          </p>
          {publication.excerpt && (
            <p className="line-clamp-2 text-xs text-[color:var(--color-text-secondary)]">{publication.excerpt}</p>
          )}
          <div className="mt-auto flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <i className="bi bi-heart" />
              {publication.likesCount}
            </span>
            <span className="flex items-center gap-1">
              <i className="bi bi-chat" />
              {publication.commentsCount}
            </span>
            <span className="flex items-center gap-1">
              <i className="bi bi-eye" />
              {publication.viewsCount}
            </span>
            <span>{formatRelativeDate(publication.createdAt)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
