import { afterEach, describe, expect, it, vi } from "vitest";
import { hapticNotify, hapticSuccess, hapticTap } from "./haptic";

describe("haptic", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("no-ops when vibrate is unsupported", () => {
    vi.stubGlobal("navigator", {});
    Object.defineProperty(window, "innerWidth", { value: 390, configurable: true });
    expect(() => hapticTap()).not.toThrow();
  });

  it("vibrates on mobile viewport", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    Object.defineProperty(window, "innerWidth", { value: 390, configurable: true });

    hapticTap();
    expect(vibrate).toHaveBeenCalledWith(50);

    hapticNotify();
    expect(vibrate).toHaveBeenCalledWith(30);

    hapticSuccess();
    expect(vibrate).toHaveBeenCalledWith([50, 30, 50]);
  });

  it("skips vibrate on desktop width", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    Object.defineProperty(window, "innerWidth", { value: 1280, configurable: true });

    hapticSuccess();
    expect(vibrate).not.toHaveBeenCalled();
  });
});
