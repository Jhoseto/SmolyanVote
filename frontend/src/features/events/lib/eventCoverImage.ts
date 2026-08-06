/** Static event cover paths returned when no Cloudinary upload exists. */
const EVENT_PLACEHOLDER_PATTERN = /\/images\/eventImages\/default/i;

/** Prefer a real upload over a Spring/static placeholder cover. */
export function pickEventCoverImage(images?: string[] | null): string | undefined {
  if (!images?.length) return undefined;
  const uploaded = images.find((url) => url && !EVENT_PLACEHOLDER_PATTERN.test(url));
  return uploaded ?? images[0];
}
