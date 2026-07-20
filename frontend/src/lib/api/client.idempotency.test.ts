import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_API_URL: "",
    NEXT_PUBLIC_WS_URL: "/ws-svmessenger",
    NEXT_PUBLIC_BACKEND_ORIGIN: "http://localhost:2662",
    NEXT_PUBLIC_LIVEKIT_URL: "wss://example.livekit.cloud",
  },
}));

vi.mock("./tokenStore", () => ({
  tokenStore: {
    getAccess: () => "test-access-token-with-enough-length-for-bearer",
    getRefresh: () => null,
    set: vi.fn(),
    clear: vi.fn(),
    isPersistent: () => false,
  },
}));

describe("apiClient Idempotency-Key", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("attaches Idempotency-Key header on post when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiClient } = await import("./client");
    await apiClient.post("/api/v1/votes/simple", {
      body: { eventId: 1, vote: "1" },
      idempotencyKey: "key-abc-123",
    });

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Idempotency-Key")).toBe("key-abc-123");
    expect(headers.get("Authorization")).toMatch(/^Bearer /);
  });
});
