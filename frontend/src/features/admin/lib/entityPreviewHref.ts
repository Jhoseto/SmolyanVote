export function entityPreviewHref(
  entityType: string,
  entityId: number,
  entityLabel?: string | null,
): string | null {
  const t = entityType.toUpperCase();
  if (t.includes("SIMPLE") || t === "EVENT") return `/event/${entityId}`;
  if (t.includes("REFERENDUM")) return `/referendum/${entityId}`;
  if (t.includes("MULTI")) return `/multipoll/${entityId}`;
  if (t.includes("PUBLICATION") || t.includes("POST")) return `/publications?openModal=${entityId}`;
  if (t.includes("SIGNAL")) return `/signals?openSignal=${entityId}`;
  if (t.includes("COMMENT")) return `/publications?openModal=${entityId}`;
  if (t.includes("USER") && entityLabel) return `/user/${encodeURIComponent(entityLabel)}`;
  return null;
}
