import { ref, type Ref } from "vue";
import type { PanelSide } from "./controller";

export interface PanelResizeOptions {
  side: PanelSide;
  value: Ref<number>;
  setLive: (value: number) => void;
  commit: (value: number) => void;
  min: number;
  max: number;
  onDraggingChange?: (dragging: boolean) => void;
  onNudge?: () => void;
}

export interface PanelResize {
  readonly resizing: Ref<boolean>;
  onPointerDown(event: PointerEvent): void;
  onKeyDown(event: KeyboardEvent): void;
  dispose(): void;
}

const STEP_PX = 8;
const SHIFT_STEP_PX = 32;

export function usePanelResize(options: PanelResizeOptions): PanelResize {
  const resizing = ref(false);
  let pointerId: number | null = null;
  let handle: HTMLElement | null = null;

  function widthFor(event: PointerEvent): number {
    return options.side === "left" ? event.clientX : window.innerWidth - event.clientX;
  }

  function move(event: PointerEvent): void {
    if (event.pointerId !== pointerId) return;
    options.setLive(widthFor(event));
  }

  function removeListeners(): void {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  }

  function finish(event?: PointerEvent): void {
    if (!resizing.value) return;
    if (event !== undefined && event.pointerId !== pointerId) return;
    removeListeners();
    if (handle !== null && pointerId !== null) {
      try {
        handle.releasePointerCapture(pointerId);
      } catch {
        // Capture may already be gone after pointer cancellation.
      }
    }
    resizing.value = false;
    pointerId = null;
    handle = null;
    options.onDraggingChange?.(false);
    options.commit(options.value.value);
  }

  function end(event: PointerEvent): void {
    finish(event);
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    if (resizing.value) return;
    resizing.value = true;
    pointerId = event.pointerId;
    handle = event.currentTarget as HTMLElement | null;
    options.onDraggingChange?.(true);
    try {
      handle?.setPointerCapture(pointerId);
    } catch {
      // Window listeners preserve the gesture without capture.
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function onKeyDown(event: KeyboardEvent): void {
    const grow = options.side === "left" ? "ArrowRight" : "ArrowLeft";
    const shrink = options.side === "left" ? "ArrowLeft" : "ArrowRight";
    let next: number;
    if (event.key === "Home") next = options.min;
    else if (event.key === "End") next = options.max;
    else if (event.key === grow) next = options.value.value + (event.shiftKey ? SHIFT_STEP_PX : STEP_PX);
    else if (event.key === shrink) next = options.value.value - (event.shiftKey ? SHIFT_STEP_PX : STEP_PX);
    else return;
    event.preventDefault();
    options.onNudge?.();
    options.commit(next);
  }

  return {
    resizing,
    onPointerDown,
    onKeyDown,
    dispose: finish,
  };
}
