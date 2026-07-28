import type { ReactNode } from "react";

const TOKEN_RE = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])|(^|\s)@([\p{L}\p{N}_.-]{2,30})/gu;

/** Split text into plain spans, external link anchors and profile mentions. */
export function linkifyText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE.source, "gu");

  while ((match = re.exec(text)) !== null) {
    const [, url, lead, username] = match;
    const tokenStart = match.index + (url ? 0 : (lead ?? "").length);

    if (tokenStart > lastIndex) {
      nodes.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, tokenStart)}</span>);
    }

    if (url) {
      nodes.push(
        <a
          key={`a-${tokenStart}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {url}
        </a>,
      );
      lastIndex = tokenStart + url.length;
    } else {
      nodes.push(
        <a
          key={`m-${tokenStart}`}
          href={`/user/${username}`}
          className="font-semibold text-primary hover:underline"
        >
          @{username}
        </a>,
      );
      lastIndex = tokenStart + username.length + 1;
    }
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes.length > 0 ? nodes : [<span key="empty">{text}</span>];
}

const URL_RE = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/gu;

/** Every absolute URL inside a message body, in order of appearance. */
export function extractUrls(text: string): string[] {
  return text.match(new RegExp(URL_RE.source, "gu")) ?? [];
}

/** `https://www.example.com/a/b` → `example.com`. Falls back to the raw value. */
export function urlHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
