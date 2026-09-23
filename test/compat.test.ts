import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Chrome 91 compatibility", () => {
  it("does not rely on post-Chrome-91 color-mix CSS", () => {
    const component = readFileSync(resolve(process.cwd(), "src/SidePanel.vue"), "utf8");
    expect(component).not.toContain("color-mix(");
  });
});
