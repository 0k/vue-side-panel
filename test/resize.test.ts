import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePanelResize } from "../src/index";

function pointer(type: string, init: PointerEventInit): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 3,
    pointerType: "touch",
    button: 0,
    ...init,
  });
}

function setup(side: "left" | "right") {
  const value = ref(300);
  const live = vi.fn((next: number) => { value.value = next; });
  const commit = vi.fn((next: number) => { value.value = next; });
  const resize = usePanelResize({ side, value, setLive: live, commit, min: 100, max: 900 });
  const handle = document.createElement("div");
  handle.addEventListener("pointerdown", resize.onPointerDown as EventListener);
  document.body.append(handle);
  return { value, live, commit, resize, handle };
}

describe("panel resize", () => {
  it("maps left and right panel pointers from their own viewport edge", () => {
    window.innerWidth = 1200;
    const left = setup("left");
    left.handle.dispatchEvent(pointer("pointerdown", { clientX: 300 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 420 }));
    expect(left.live).toHaveBeenLastCalledWith(420);
    window.dispatchEvent(pointer("pointerup", { clientX: 420 }));

    const right = setup("right");
    right.handle.dispatchEvent(pointer("pointerdown", { clientX: 900 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 760 }));
    expect(right.live).toHaveBeenLastCalledWith(440);
    window.dispatchEvent(pointer("pointerup", { clientX: 760 }));
  });

  it("commits once and removes listeners on pointer cancellation", () => {
    const { handle, live, commit, resize } = setup("left");
    handle.dispatchEvent(pointer("pointerdown", { clientX: 300 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 360 }));
    window.dispatchEvent(pointer("pointercancel", { clientX: 360 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 500 }));

    expect(resize.resizing.value).toBe(false);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(360);
    expect(live).toHaveBeenCalledTimes(1);
  });

  it("grows inward, shrinks outward, and supports bounds from the keyboard", () => {
    const left = setup("left");
    left.resize.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(left.commit).toHaveBeenLastCalledWith(308);
    left.resize.onKeyDown(new KeyboardEvent("keydown", { key: "Home" }));
    expect(left.commit).toHaveBeenLastCalledWith(100);

    const right = setup("right");
    right.resize.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowLeft", shiftKey: true }));
    expect(right.commit).toHaveBeenLastCalledWith(332);
    right.resize.onKeyDown(new KeyboardEvent("keydown", { key: "End" }));
    expect(right.commit).toHaveBeenLastCalledWith(900);
  });

  it("cleans an active gesture when its component unmounts", () => {
    const { handle, commit, resize } = setup("left");
    handle.dispatchEvent(pointer("pointerdown", { clientX: 300 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 380 }));
    resize.dispose();
    window.dispatchEvent(pointer("pointermove", { clientX: 450 }));

    expect(resize.resizing.value).toBe(false);
    expect(commit).toHaveBeenCalledWith(380);
  });
});
