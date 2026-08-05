import { resolveApiUrl } from "@/config/env";
import { TOPIC_HUBS } from "@/features/topics/data/topicHubs";

const BASE = "https://smolyanvote.com";

async function fetchLines(): Promise<string[]> {
  const lines: string[] = [
    "# SmolyanVote AI Sitemap — canonical cite URLs",
    `# Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    BASE + "/",
    BASE + "/about",
    BASE + "/faq",
    BASE + "/events",
    BASE + "/publications",
    BASE + "/signals",
    BASE + "/podcast",
    BASE + "/monitor",
    BASE + "/monitor/methodology",
    BASE + "/topics",
  ];

  for (const hub of TOPIC_HUBS) {
    lines.push(`${BASE}/topics/${hub.slug}`);
  }

  try {
    let page = 0;
    let hasNext = true;
    while (hasNext && page < 10) {
      const res = await fetch(
        resolveApiUrl(`/api/v1/publications?page=${page}&size=100&sort=date-desc`),
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) break;
      const data = (await res.json()) as { content?: Array<{ id: number }>; hasNext?: boolean };
      for (const p of data.content ?? []) lines.push(`${BASE}/publications/${p.id}`);
      hasNext = Boolean(data.hasNext);
      page += 1;
    }
  } catch {
    /* skip */
  }

  try {
    const sigRes = await fetch(resolveApiUrl("/api/v1/signals/dataset"), { next: { revalidate: 3600 } });
    if (sigRes.ok) {
      const signals = (await sigRes.json()) as Array<{ id: number }>;
      for (const s of signals) lines.push(`${BASE}/signals/${s.id}`);
    }
  } catch {
    /* skip */
  }

  try {
    const evRes = await fetch(resolveApiUrl("/api/v1/events"), { next: { revalidate: 3600 } });
    if (evRes.ok) {
      const data = (await evRes.json()) as {
        events?: Array<{ id: number; eventType: string }>;
      };
      for (const e of data.events ?? []) {
        if (e.eventType === "REFERENDUM") lines.push(`${BASE}/referendum/${e.id}`);
        else if (e.eventType === "MULTI_POLL") lines.push(`${BASE}/multipoll/${e.id}`);
        else lines.push(`${BASE}/event/${e.id}`);
      }
    }
  } catch {
    /* skip */
  }

  try {
    const podRes = await fetch(resolveApiUrl("/api/podcast/episodes"), { next: { revalidate: 3600 } });
    if (podRes.ok) {
      const eps = (await podRes.json()) as Array<{ id: number }>;
      for (const ep of eps) lines.push(`${BASE}/podcast/episode/${ep.id}`);
    }
  } catch {
    /* skip */
  }

  try {
    let page = 0;
    let hasNext = true;
    const seen = new Set<string>();
    while (hasNext && page < 15) {
      const res = await fetch(
        resolveApiUrl(`/api/v1/monitor/feed?page=${page}&size=100&type=all`),
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) break;
      const data = (await res.json()) as {
        content?: Array<{ id: string; itemType: string }>;
        hasNext?: boolean;
        last?: boolean;
      };
      for (const item of data.content ?? []) {
        const id = item.id.replace(/\D/g, "") || item.id;
        const url =
          item.itemType === "contract"
            ? `${BASE}/monitor/contract/${id}`
            : item.itemType === "document"
              ? `${BASE}/monitor/document/${id}`
              : null;
        if (url && !seen.has(url)) {
          seen.add(url);
          lines.push(url);
        }
      }
      hasNext = Boolean(data.hasNext ?? !data.last);
      page += 1;
    }
  } catch {
    /* skip */
  }

  return lines;
}

export async function GET() {
  const lines = await fetchLines();
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
