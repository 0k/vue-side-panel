import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Chrome 91 compatibility", () => {
  it("does not rely on post-Chrome-91 color-mix CSS", () => {
    const component = readFileSync(resolve(process.cwd(), "src/SidePanel.vue"), "utf8");
    expect(component).not.toContain("color-mix(");
  });

  it("sizes the backdrop button explicitly so it covers the viewport", () => {
    // Chrome 91 does not stretch a fixed-position <button> between
    // opposing insets: `inset: 0` alone leaves it 0px wide, so the
    // drawer's scrim neither dims nor intercepts taps.
    const component = readFileSync(resolve(process.cwd(), "src/SidePanel.vue"), "utf8");
    const rule = component.match(/\.side-panel__backdrop\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(rule).toMatch(/(^|[;\s])width:\s*100%/);
    expect(rule).toMatch(/(^|[;\s])height:\s*100%/);
  });
});
