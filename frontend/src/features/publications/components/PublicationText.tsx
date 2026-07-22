import Link from "next/link";

/**
 * Renders publication/comment text with clickable #hashtags and @mentions.
 */
export function PublicationText({
  text,
  className,
  onHashtagClick,
}: {
  text: string;
  className?: string;
  onHashtagClick?: (tag: string) => void;
}) {
  const parts = text.split(/([#@][\p{L}\p{N}_]+)/gu);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("#") && part.length > 1) {
          const tag = part.slice(1);
          if (onHashtagClick) {
            return (
              <button
                key={`${part}-${i}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHashtagClick(tag);
                }}
                className="font-semibold text-primary hover:underline"
              >
                {part}
              </button>
            );
          }
          return (
            <Link
              key={`${part}-${i}`}
              href={`/publications?search=${encodeURIComponent(tag)}`}
              className="font-semibold text-primary hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("@") && part.length > 1) {
          const username = part.slice(1);
          return (
            <Link
              key={`${part}-${i}`}
              href={`/user/${encodeURIComponent(username)}`}
              className="font-semibold text-primary hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={`${part}-${i}`}>{part}</span>;
      })}
    </span>
  );
}
