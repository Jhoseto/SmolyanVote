import { describe, expect, it } from "vitest";
import { MOTIVATION_PANELS } from "./motivationPanels";

describe("MOTIVATION_PANELS", () => {
  it("keeps the 6 v1 panels", () => {
    expect(MOTIVATION_PANELS).toHaveLength(6);
  });

  it("has unique ids", () => {
    const ids = MOTIVATION_PANELS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every panel has content and feature bullets", () => {
    for (const panel of MOTIVATION_PANELS) {
      expect(panel.title.length).toBeGreaterThan(0);
      expect(panel.preview.length).toBeGreaterThan(0);
      expect(panel.details.length).toBeGreaterThan(0);
      expect(panel.features.length).toBeGreaterThan(0);
    }
  });
});
