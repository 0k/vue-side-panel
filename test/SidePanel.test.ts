import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { describe, expect, it } from "vitest";
import {
  SidePanel,
  createPanelController,
  __setDesktopWideForTests,
} from "../src/index";

function controller(side: "left" | "right" = "left") {
  return createPanelController({
    id: `menu-${side}`,
    side,
    defaultWidth: 240,
    minWidth: 192,
    maxWidth: 480,
    collapsedStorageKey: "test.closed",
    widthStorageKey: "test.width",
    cssWidthVariable: "--test-width",
  });
}

function mountPanel(side: "left" | "right" = "left") {
  const panel = controller(side);
  const Host = defineComponent({
    setup() {
      return () => h(SidePanel, {
        controller: panel,
        panelLabel: "Collections",
        closeLabel: "Close collections",
        reopenLabel: "Open collections",
        resizeLabel: "Resize collections",
        hostClass: "fixture-panel-theme",
      }, {
        header: () => h("h1", "Archive"),
        default: () => h("nav", "Tree"),
        footer: () => h("footer", "Read only"),
      });
    },
  });
  return { panel, wrapper: mount(Host, { attachTo: document.body }) };
}

describe("SidePanel", () => {
  it("renders configurable accessible chrome and ordered slots", () => {
    __setDesktopWideForTests(true);
    const { wrapper } = mountPanel();
    const aside = wrapper.get("aside");

    expect(aside.attributes("aria-label")).toBe("Collections");
    expect(wrapper.get("[data-side-panel-close]").attributes("aria-label")).toBe("Close collections");
    expect(wrapper.get("[role=separator]").attributes("aria-label")).toBe("Resize collections");
    expect(aside.find("h1").text()).toBe("Archive");
    expect(aside.find("nav").text()).toBe("Tree");
    expect(aside.find("footer").text()).toBe("Read only");
    expect(aside.find("footer").classes()).toContain("side-panel__footer");
    expect(wrapper.get(".side-panel-host").classes()).toContain("fixture-panel-theme");
  });

  it("renders an inner-edge chevron for each side instead of an X", () => {
    __setDesktopWideForTests(true);
    const left = mountPanel("left");
    const leftClose = left.wrapper.get("[data-side-panel-close]");
    expect(leftClose.text()).toBe("");
    expect(leftClose.get("svg path").attributes("d")).toBe("M15 18l-6-6 6-6");
    left.wrapper.unmount();

    const right = mountPanel("right");
    expect(right.wrapper.get("[data-side-panel-close] svg path").attributes("d"))
      .toBe("M9 6l6 6-6 6");
  });

  it("keeps the close slot as an explicit host override", () => {
    __setDesktopWideForTests(true);
    const panel = controller();
    const wrapper = mount(SidePanel, {
      props: {
        controller: panel,
        panelLabel: "Panel",
        closeLabel: "Collapse",
        reopenLabel: "Reopen",
        resizeLabel: "Resize",
      },
      slots: {
        close: ({ close }: { close: () => void }) => h(
          "button",
          { class: "custom-collapse", onClick: close },
          "custom",
        ),
      },
    });
    expect(wrapper.find("[data-side-panel-close]").exists()).toBe(false);
    wrapper.get(".custom-collapse").trigger("click");
    expect(panel.collapsed.value).toBe(true);
  });

  it("dismisses a drawer by backdrop and Escape", async () => {
    __setDesktopWideForTests(false);
    const { panel, wrapper } = mountPanel();
    panel.openDrawer();
    await nextTick();
    expect(wrapper.find("[data-side-panel-backdrop]").exists()).toBe(true);
    await wrapper.get("[data-side-panel-backdrop]").trigger("click");
    expect(panel.drawerOpen.value).toBe(false);

    panel.openDrawer();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    expect(panel.drawerOpen.value).toBe(false);
  });

  it("keeps a closed drawer mounted but hidden and non-interactive", async () => {
    __setDesktopWideForTests(false);
    const { wrapper } = mountPanel();
    await nextTick();
    const aside = wrapper.get("aside");
    expect(aside.attributes("aria-hidden")).toBe("true");
    expect(aside.attributes("inert")).toBeDefined();
    expect(aside.classes()).toContain("side-panel--drawer");
    expect(aside.classes()).not.toContain("side-panel--open");
  });

  it("collapses on desktop and exposes the reopen control at the panel edge", async () => {
    __setDesktopWideForTests(true);
    const { panel, wrapper } = mountPanel();
    await wrapper.get("[data-side-panel-close]").trigger("click");
    expect(panel.collapsed.value).toBe(true);
    const reopen = wrapper.get("[data-side-panel-reopen]");
    expect(reopen.attributes("aria-label")).toBe("Open collections");
    expect(reopen.classes()).toContain("side-panel__reopen--left");
    await reopen.trigger("click");
    expect(panel.collapsed.value).toBe(false);
  });
});
