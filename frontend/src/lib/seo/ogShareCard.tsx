import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export type OgShareKind = "publication" | "event" | "referendum" | "multipoll";

export interface OgShareCardInput {
  kind: OgShareKind;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  coverUrl?: string | null;
}

const KIND_LABEL: Record<OgShareKind, string> = {
  publication: "Публикация",
  event: "Гласуване",
  referendum: "Референдум",
  multipoll: "Анкета",
};

const GOLD = "#D4B973";
const TITLE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.78)";

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function titleSize(title: string, hasCover: boolean): number {
  const len = title.length;
  if (hasCover) {
    if (len <= 36) return 58;
    if (len <= 60) return 46;
    if (len <= 90) return 38;
    return 32;
  }
  if (len <= 36) return 68;
  if (len <= 60) return 54;
  if (len <= 90) return 44;
  return 36;
}

async function loadLogo(): Promise<string | null> {
  try {
    const bytes = await readFile(join(process.cwd(), "public/images/logoNew.png"));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Civic photo — only used when there is no real content cover (never hero3/SMVshare collages). */
async function loadVoteAtmosphere(): Promise<string | null> {
  try {
    const bytes = await readFile(join(process.cwd(), "public/images/web/contacts.jpg"));
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }>
> {
  try {
    const [display, body] = await Promise.all([
      fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/manrope@5.2.5/cyrillic-700-normal.woff",
      ).then((r) => (r.ok ? r.arrayBuffer() : null)),
      fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/source-sans-3@5.2.5/cyrillic-400-normal.woff",
      ).then((r) => (r.ok ? r.arrayBuffer() : null)),
    ]);
    const fonts: Array<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }> = [];
    if (display) fonts.push({ name: "Manrope", data: display, weight: 700, style: "normal" });
    if (body) fonts.push({ name: "Source Sans 3", data: body, weight: 400, style: "normal" });
    return fonts;
  } catch {
    return [];
  }
}

/**
 * Cinematic OG card — full-bleed photo (or deep brand field) with
 * a strong title overlay. No split dashboards, pills, or branding collages.
 */
export async function renderOgShareCard(input: OgShareCardInput): Promise<ImageResponse> {
  const isVote = input.kind !== "publication";
  const [logo, voteAtmosphere, fonts] = await Promise.all([
    loadLogo(),
    isVote ? loadVoteAtmosphere() : Promise.resolve(null),
    loadFonts(),
  ]);

  const kind = KIND_LABEL[input.kind];
  const title = truncate(input.title, 140) || "SmolyanVote";
  const subtitle = isVote ? null : input.subtitle ? truncate(input.subtitle, 96) : null;
  const meta = truncate(input.meta || "Смолян · smolyanvote.com", 70);
  const cover = input.coverUrl?.trim() || voteAtmosphere;
  const hasCover = Boolean(cover);
  const fontSize = titleSize(title, hasCover);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(145deg, #0B2E1F 0%, #14532D 45%, #0F7B59 100%)",
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        ) : null}

        {/* Atmospheric depth — keeps the photo visible, text crystal clear */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: hasCover
              ? "linear-gradient(100deg, rgba(8,30,20,0.92) 0%, rgba(8,30,20,0.72) 42%, rgba(8,30,20,0.28) 70%, rgba(8,30,20,0.45) 100%)"
              : "radial-gradient(1200px 600px at 15% 20%, rgba(72,162,76,0.28) 0%, transparent 55%), radial-gradient(900px 500px at 90% 90%, rgba(212,185,115,0.14) 0%, transparent 50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 35%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "44px 52px 40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={48}
                height={48}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                }}
              />
            ) : null}
            <div
              style={{
                display: "flex",
                fontFamily: "Manrope, sans-serif",
                fontSize: 30,
                fontWeight: 700,
                color: TITLE,
                letterSpacing: -0.6,
                textShadow: "0 2px 12px rgba(0,0,0,0.35)",
              }}
            >
              SmolyanVote
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 860,
            }}
          >
            <div style={{ display: "flex", width: 44, height: 2, background: GOLD }} />

            <div
              style={{
                display: "flex",
                fontFamily: "Source Sans 3, sans-serif",
                fontSize: 18,
                color: GOLD,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              {kind}
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Manrope, sans-serif",
                fontSize,
                fontWeight: 700,
                lineHeight: 1.1,
                color: TITLE,
                letterSpacing: -1.4,
                textShadow: "0 4px 28px rgba(0,0,0,0.45)",
              }}
            >
              {title}
            </div>

            {subtitle ? (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Source Sans 3, sans-serif",
                  fontSize: 22,
                  lineHeight: 1.35,
                  color: MUTED,
                  maxWidth: 760,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Source Sans 3, sans-serif",
              fontSize: 18,
              color: MUTED,
              letterSpacing: 0.3,
            }}
          >
            {meta}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  );
}
