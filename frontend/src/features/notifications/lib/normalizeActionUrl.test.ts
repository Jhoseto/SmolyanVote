import { describe, expect, it } from "vitest";
import { normalizeActionUrl } from "./normalizeActionUrl";

describe("normalizeActionUrl", () => {
  it("maps legacy signal notification URLs", () => {
    expect(normalizeActionUrl("/signals/mainView?openSignal=42")).toBe("/signals?openSignal=42");
  });

  it("maps /signals/{id}", () => {
    expect(normalizeActionUrl("/signals/7")).toBe("/signals?openSignal=7");
  });

  it("maps create-form aliases", () => {
    expect(normalizeActionUrl("/createNewEvent")).toBe("/event/new");
    expect(normalizeActionUrl("/referendum")).toBe("/referendum/new");
    expect(normalizeActionUrl("/multipoll/createMultiPoll")).toBe("/multipoll/new");
  });

  it("leaves modern Next paths unchanged", () => {
    expect(normalizeActionUrl("/event/3")).toBe("/event/3");
    expect(normalizeActionUrl("/signals?openSignal=1")).toBe("/signals?openSignal=1");
  });
});
