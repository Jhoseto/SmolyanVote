import { describe, expect, it } from "vitest";
import { buildSocialMetadata, firstImage } from "./buildSocialMetadata";

describe("buildSocialMetadata", () => {
  it("includes openGraph and twitter cards with image", () => {
    const meta = buildSocialMetadata({
      title: "Тестово събитие",
      description: "Описание на събитието за OG",
      path: "/event/42",
      image: "https://cdn.example.com/img.jpg",
    });

    expect(meta.title).toContain("Тестово събитие");
    expect(meta.openGraph?.url).toBe("https://smolyanvote.com/event/42");
    expect(meta.openGraph?.images).toEqual([
      expect.objectContaining({ url: "https://cdn.example.com/img.jpg" }),
    ]);
    expect(meta.twitter).toEqual(
      expect.objectContaining({
        card: "summary_large_image",
        images: ["https://cdn.example.com/img.jpg"],
      }),
    );
  });

  it("falls back to default share image", () => {
    const meta = buildSocialMetadata({
      title: "Без снимка",
      path: "/event/1",
    });
    const images = meta.openGraph?.images;
    expect(Array.isArray(images) && images[0]).toEqual(
      expect.objectContaining({ url: "https://smolyanvote.com/images/SMVshare.JPG" }),
    );
  });
});

describe("firstImage", () => {
  it("picks first non-empty candidate", () => {
    expect(firstImage(null, [], "https://a.test/x.jpg")).toBe("https://a.test/x.jpg");
    expect(firstImage(["https://a.test/1.jpg", "https://a.test/2.jpg"])).toBe(
      "https://a.test/1.jpg",
    );
  });
});
