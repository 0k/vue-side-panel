import { describe, expect, it, vi } from "vitest";
import {
  createDrawerGroup,
  createPanelController,
  type PanelControllerOptions,
  type PanelStorage,
} from "../src/index";

function options(
  overrides: Partial<PanelControllerOptions> = {},
): PanelControllerOptions {
  return {
    id: "archive",
    side: "left" as const,
    defaultWidth: 320,
    minWidth: 240,
    maxWidth: 560,
    collapsedStorageKey: "host.panel.collapsed",
    widthStorageKey: "host.panel.width",
    cssWidthVariable: "--host-panel-width",
    ...overrides,
  };
}

describe("panel controller", () => {
  it("persists desktop collapse and bounded width under host keys", () => {
    const controller = createPanelController(options());
    controller.setCollapsed(true);
    controller.setWidth(999);

    expect(controller.collapsed.value).toBe(true);
    expect(controller.width.value).toBe(560);
    expect(localStorage.getItem("host.panel.collapsed")).toBe("1");
    expect(localStorage.getItem("host.panel.width")).toBe("560");
    expect(document.documentElement.style.getPropertyValue("--host-panel-width")).toBe("560px");
  });

  it("continues in memory when every storage operation throws", () => {
    const broken: PanelStorage = {
      getItem: vi.fn(() => { throw new Error("read denied"); }),
      setItem: vi.fn(() => { throw new Error("write denied"); }),
      removeItem: vi.fn(() => { throw new Error("remove denied"); }),
    };
    const controller = createPanelController(options({ storage: broken }));

    expect(controller.collapsed.value).toBe(false);
    expect(controller.width.value).toBe(320);
    expect(() => controller.setCollapsed(true)).not.toThrow();
    expect(() => controller.setWidth(400)).not.toThrow();
    expect(controller.collapsed.value).toBe(true);
    expect(controller.width.value).toBe(400);
  });

  it("notifies host adapters only for committed state", () => {
    const onCollapsedCommit = vi.fn();
    const onWidthCommit = vi.fn();
    const controller = createPanelController(options({ onCollapsedCommit, onWidthCommit }));

    controller.setWidthLive(410);
    expect(onWidthCommit).not.toHaveBeenCalled();
    controller.setWidth(420);
    controller.setCollapsed(true);
    expect(onWidthCommit).toHaveBeenCalledWith(420);
    expect(onCollapsedCommit).toHaveBeenCalledWith(true);
  });

  it("uses one transient drawer selection for both Health panels", () => {
    const group = createDrawerGroup<"left" | "right">("left");
    const left = createPanelController(options({ id: "left", drawerGroup: group }));
    const right = createPanelController(options({
      id: "right",
      side: "right",
      drawerGroup: group,
    }));

    expect(left.drawerOpen.value).toBe(true);
    expect(right.drawerOpen.value).toBe(false);
    right.openDrawer();
    expect(group.open.value).toBe("right");
    expect(left.drawerOpen.value).toBe(false);
    expect(right.drawerOpen.value).toBe(true);
    right.closeDrawer();
    expect(group.open.value).toBeNull();
  });
});
