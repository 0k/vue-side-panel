import { computed, ref, watch, type ComputedRef, type Ref } from "vue";
import { usePanelViewport } from "./viewport";

export type PanelSide = "left" | "right";
export type WidthMode = "layout" | "drag" | "nudge";

export interface PanelStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface DrawerGroup<Id extends string = string> {
  readonly open: Ref<Id | null>;
  openDrawer(id: Id): void;
  closeDrawer(id?: Id): void;
}

export interface PanelControllerOptions<Id extends string = string> {
  id: Id;
  side: PanelSide;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  collapsedStorageKey: string;
  widthStorageKey: string;
  cssWidthVariable: `--${string}`;
  storage?: PanelStorage;
  drawerGroup?: DrawerGroup<Id>;
  initialDrawerOpen?: boolean;
  onCollapsedCommit?: (collapsed: boolean) => void;
  onWidthCommit?: (width: number) => void;
}

export interface PanelController<Id extends string = string> {
  readonly id: Id;
  readonly side: PanelSide;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly collapsed: Ref<boolean>;
  readonly width: Ref<number>;
  readonly widthMode: Ref<WidthMode>;
  readonly isDesktopWide: Ref<boolean>;
  readonly drawerOpen: ComputedRef<boolean>;
  readonly visible: ComputedRef<boolean>;
  readonly docked: ComputedRef<boolean>;
  readonly reopenVisible: ComputedRef<boolean>;
  setCollapsed(value: boolean): void;
  setWidth(value: number): void;
  setWidthLive(value: number): void;
  setDragging(value: boolean): void;
  markNudge(): void;
  openDrawer(): void;
  closeDrawer(): void;
  openPanel(): void;
  closePanel(): void;
  togglePanel(): void;
  dispose(): void;
}

const NUDGE_LINGER_MS = 200;

function browserStorage(): PanelStorage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

function read(storage: PanelStorage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(
  storage: PanelStorage | undefined,
  key: string,
  value: string | null,
): void {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Persistence is optional; the current session remains usable.
  }
}

function notify<T>(callback: ((value: T) => void) | undefined, value: T): void {
  try {
    callback?.(value);
  } catch {
    // Native/host persistence is best-effort for the same reason as storage.
  }
}

export function createDrawerGroup<Id extends string>(initial: Id | null = null): DrawerGroup<Id> {
  const open = ref<Id | null>(initial) as Ref<Id | null>;
  return {
    open,
    openDrawer(id: Id): void {
      open.value = id;
    },
    closeDrawer(id?: Id): void {
      if (id === undefined || open.value === id) open.value = null;
    },
  };
}

export function createPanelController<Id extends string = string>(
  options: PanelControllerOptions<Id>,
): PanelController<Id> {
  const {
    id,
    side,
    defaultWidth,
    minWidth,
    maxWidth,
    collapsedStorageKey,
    widthStorageKey,
    cssWidthVariable,
    onCollapsedCommit,
    onWidthCommit,
  } = options;
  const storage = options.storage ?? browserStorage();
  const drawerGroup = options.drawerGroup ?? createDrawerGroup<Id>(
    options.initialDrawerOpen ? id : null,
  );
  const { isDesktopWide } = usePanelViewport();

  function clamp(value: number): number {
    if (!Number.isFinite(value)) return defaultWidth;
    return Math.max(minWidth, Math.min(maxWidth, Math.round(value)));
  }

  const collapsed = ref(read(storage, collapsedStorageKey) === "1");
  const storedWidth = read(storage, widthStorageKey);
  const width = ref(storedWidth === null ? defaultWidth : clamp(Number(storedWidth)));
  const widthMode = ref<WidthMode>("layout");
  let nudgeTimer: ReturnType<typeof setTimeout> | null = null;

  function applyWidth(value: number): void {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(cssWidthVariable, `${value}px`);
  }

  applyWidth(width.value);
  const stopViewportWatch = watch(isDesktopWide, (wide) => {
    if (wide) drawerGroup.closeDrawer(id);
  });

  const drawerOpen = computed(() => drawerGroup.open.value === id);
  const visible = computed(() => isDesktopWide.value ? !collapsed.value : drawerOpen.value);
  const docked = computed(() => isDesktopWide.value && !collapsed.value);
  const reopenVisible = computed(() => isDesktopWide.value
    ? collapsed.value
    : drawerGroup.open.value === null);

  function clearNudgeTimer(): void {
    if (nudgeTimer === null) return;
    clearTimeout(nudgeTimer);
    nudgeTimer = null;
  }

  const controller: PanelController<Id> = {
    id,
    side,
    minWidth,
    maxWidth,
    collapsed,
    width,
    widthMode,
    isDesktopWide,
    drawerOpen,
    visible,
    docked,
    reopenVisible,
    setCollapsed(value: boolean): void {
      collapsed.value = value;
      write(storage, collapsedStorageKey, value ? "1" : null);
      notify(onCollapsedCommit, value);
    },
    setWidth(value: number): void {
      const next = clamp(value);
      width.value = next;
      applyWidth(next);
      write(storage, widthStorageKey, String(next));
      notify(onWidthCommit, next);
    },
    setWidthLive(value: number): void {
      const next = clamp(value);
      width.value = next;
      applyWidth(next);
    },
    setDragging(value: boolean): void {
      clearNudgeTimer();
      widthMode.value = value ? "drag" : "layout";
    },
    markNudge(): void {
      clearNudgeTimer();
      if (widthMode.value === "drag") return;
      widthMode.value = "nudge";
      nudgeTimer = setTimeout(() => {
        nudgeTimer = null;
        widthMode.value = "layout";
      }, NUDGE_LINGER_MS);
    },
    openDrawer(): void {
      drawerGroup.openDrawer(id);
    },
    closeDrawer(): void {
      drawerGroup.closeDrawer(id);
    },
    openPanel(): void {
      if (isDesktopWide.value) controller.setCollapsed(false);
      else controller.openDrawer();
    },
    closePanel(): void {
      if (isDesktopWide.value) controller.setCollapsed(true);
      else controller.closeDrawer();
    },
    togglePanel(): void {
      if (visible.value) controller.closePanel();
      else controller.openPanel();
    },
    dispose(): void {
      clearNudgeTimer();
      stopViewportWatch();
    },
  };

  return controller;
}
