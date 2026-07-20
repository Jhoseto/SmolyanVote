import type { ReactNode } from "react";

const URL_RE = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/g;

/** Split text into plain spans + external link anchors (no new dependency). */
export function linkifyText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(URL_RE.source, "g");

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    const url = match[0];
    nodes.push(
      <a
        key={`a-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {url}
      </a>,
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes.length > 0 ? nodes : [<span key="empty">{text}</span>];
}

const EMOJI_ONLY_RE = /^(?:\p{Extended_Pictographic}|\s)+$/u;

export function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 24) return false;
  try {
    return EMOJI_ONLY_RE.test(trimmed);
  } catch {
    return false;
  }
}
