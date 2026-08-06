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

const EMOJI_ONLY_RE = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;
const EMOJI_GRAPHEME_RE =
  /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{1F1E6}-\u{1F1FF}]/u;

export interface EmojiOnlyMeta {
  isEmojiOnly: boolean;
  count: number;
}

function normalizeEmojiText(text: string): string {
  return text
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function isEmojiGrapheme(segment: string): boolean {
  if (/^\s+$/.test(segment)) return false;
  if (EMOJI_GRAPHEME_RE.test(segment)) return true;
  if (/^[0-9#*]\uFE0F?\u20E3$/u.test(segment)) return true;
  return /^[\p{Emoji}\uFE0F\u200D]+$/u.test(segment);
}

/** Split a message into emoji grapheme clusters (ignores whitespace). */
export function splitEmojiGraphemes(text: string): string[] {
  const trimmed = normalizeEmojiText(text);
  if (!trimmed) return [];

  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const out: string[] = [];
    for (const { segment } of segmenter.segment(trimmed)) {
      if (/^\s+$/.test(segment)) continue;
      out.push(segment);
    }
    return out;
  } catch {
    return [...trimmed.replace(/\s/g, "")];
  }
}

/** True when the message is only emoji graphemes (optional whitespace between). */
export function getEmojiOnlyMeta(text: string): EmojiOnlyMeta {
  const graphemes = splitEmojiGraphemes(text);
  if (graphemes.length === 0 || graphemes.length > 15) {
    return { isEmojiOnly: false, count: 0 };
  }

  if (graphemes.every(isEmojiGrapheme)) {
    return { isEmojiOnly: true, count: graphemes.length };
  }

  try {
    const normalized = normalizeEmojiText(text);
    const isEmojiOnly = EMOJI_ONLY_RE.test(normalized);
    return {
      isEmojiOnly,
      count: isEmojiOnly ? graphemes.length || normalized.replace(/\s/g, "").length : 0,
    };
  } catch {
    return { isEmojiOnly: false, count: 0 };
  }
}

export function isEmojiOnly(text: string): boolean {
  return getEmojiOnlyMeta(text).isEmojiOnly;
}
