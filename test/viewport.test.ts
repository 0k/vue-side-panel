import { beforeEach, describe, expect, it, vi } from "vitest";

describe("shared panel viewport", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates one 75rem media query and shares its reactive result", async () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const addEventListener = vi.fn((_: string, next: (event: MediaQueryListEvent) => void) => {
      listener = next;
    });
    const matchMedia = vi.fn(() => ({
      matches: false,
      media: "(min-width: 75rem)",
      onchange: null,
      addEventListener,
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList));
    vi.stubGlobal("matchMedia", matchMedia);
    window.matchMedia = matchMedia;

    const { DESKTOP_WIDE_QUERY, usePanelViewport } = await import("../src/index");
    const first = usePanelViewport();
    const second = usePanelViewport();

    expect(DESKTOP_WIDE_QUERY).toBe("(min-width: 75rem)");
    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(first.isDesktopWide).toBe(second.isDesktopWide);
    expect(first.isDesktopWide.value).toBe(false);
    listener?.({ matches: true } as MediaQueryListEvent);
    expect(first.isDesktopWide.value).toBe(true);
  });
});
