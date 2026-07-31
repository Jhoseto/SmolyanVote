/**
 * Simple worker pool — run async tasks with bounded concurrency.
 */

export async function runPool(items, concurrency, worker, { failFast = true } = {}) {
  if (items.length === 0) return { results: [], errors: [] };
  const results = [];
  const errors = [];
  let nextIndex = 0;

  async function drain() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      const item = items[index];
      try {
        const result = await worker(item, index);
        if (result !== undefined && result !== null) {
          if (Array.isArray(result)) results.push(...result);
          else results.push(result);
        }
      } catch (err) {
        errors.push({ item, index, err });
        if (failFast) throw err;
      }
    }
  }

  const workers = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workers }, () => drain()));
  return { results, errors };
}
