import { ref, type Ref } from "vue";

export const DESKTOP_WIDE_QUERY = "(min-width: 75rem)";

const isDesktopWide = ref(false);
let mediaQuery: MediaQueryList | null = null;

function onChange(event: MediaQueryListEvent): void {
  isDesktopWide.value = event.matches;
}

function initialize(): void {
  if (mediaQuery !== null) return;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  mediaQuery = window.matchMedia(DESKTOP_WIDE_QUERY);
  isDesktopWide.value = mediaQuery.matches;
  mediaQuery.addEventListener("change", onChange);
}

initialize();

export function usePanelViewport(): { isDesktopWide: Ref<boolean> } {
  initialize();
  return { isDesktopWide };
}

export function __setDesktopWideForTests(value: boolean): void {
  if (mediaQuery !== null) {
    mediaQuery.removeEventListener("change", onChange);
    mediaQuery = null;
  }
  isDesktopWide.value = value;
}
