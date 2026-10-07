<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import type { PanelController } from "./controller";
import { usePanelResize } from "./resize";

const props = withDefaults(defineProps<{
  controller: PanelController;
  panelLabel: string;
  closeLabel: string;
  reopenLabel: string;
  resizeLabel: string;
  contained?: boolean;
  showBackdrop?: boolean;
  showClose?: boolean;
  showReopen?: boolean;
  hostClass?: string;
  panelClass?: string;
  backdropClass?: string;
  closeClass?: string;
  resizeClass?: string;
  reopenClass?: string;
  panelTestId?: string;
  closeTestId?: string;
  resizeTestId?: string;
  reopenTestId?: string;
}>(), {
  contained: false,
  showBackdrop: true,
  showClose: true,
  showReopen: true,
  hostClass: "",
  panelClass: "",
  backdropClass: "",
  closeClass: "",
  resizeClass: "",
  reopenClass: "",
});

const panel = props.controller;
const resize = usePanelResize({
  side: panel.side,
  value: panel.width,
  setLive: panel.setWidthLive,
  commit: panel.setWidth,
  min: panel.minWidth,
  max: panel.maxWidth,
  onDraggingChange: panel.setDragging,
  onNudge: panel.markNudge,
});

const panelStyle = computed(() => ({
  "--side-panel-current-width": `${panel.width.value}px`,
}));

function onKeyDown(event: KeyboardEvent): void {
  if (
    event.key === "Escape"
    && !panel.isDesktopWide.value
    && panel.drawerOpen.value
  ) {
    event.stopPropagation();
    panel.closeDrawer();
  }
}

onMounted(() => document.addEventListener("keydown", onKeyDown));
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeyDown);
  resize.dispose();
});
</script>

<template>
  <div class="side-panel-host" :class="[hostClass, `side-panel-host--${panel.side}`]">
    <Transition name="side-panel-backdrop">
      <button
        v-if="showBackdrop && panel.drawerOpen.value && !panel.isDesktopWide.value"
        type="button"
        class="side-panel__backdrop"
        :class="backdropClass"
        :aria-label="closeLabel"
        data-side-panel-backdrop
        @click="panel.closeDrawer"
      />
    </Transition>

    <aside
      class="side-panel"
      :class="[
        panelClass,
        `side-panel--${panel.side}`,
        panel.isDesktopWide.value ? 'side-panel--docked' : 'side-panel--drawer',
        {
          'side-panel--contained': contained,
          'side-panel--open': panel.visible.value,
          'side-panel--dragging': panel.widthMode.value === 'drag',
          'side-panel--nudge': panel.widthMode.value === 'nudge',
        },
      ]"
      :style="panelStyle"
      :aria-label="panelLabel"
      :aria-hidden="!panel.visible.value"
      :inert="!panel.visible.value"
      :data-side-panel-id="panel.id"
      :data-testid="panelTestId"
    >
      <slot name="close" :close="panel.closePanel">
        <button
          v-if="showClose"
          type="button"
          class="side-panel__close"
          :class="closeClass"
          :aria-label="closeLabel"
          data-side-panel-close
          :data-testid="closeTestId"
          @click="panel.closePanel"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              :d="panel.side === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </slot>

      <header v-if="$slots.header" class="side-panel__header">
        <slot name="header" />
      </header>
      <div class="side-panel__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="side-panel__footer">
        <slot name="footer" />
      </footer>

      <div
        v-if="panel.isDesktopWide.value && panel.visible.value"
        class="side-panel__resize"
        :class="[
          resizeClass,
          `side-panel__resize--${panel.side}`,
          { 'side-panel__resize--active': resize.resizing.value },
        ]"
        role="separator"
        aria-orientation="vertical"
        :aria-label="resizeLabel"
        :aria-valuemin="panel.minWidth"
        :aria-valuemax="panel.maxWidth"
        :aria-valuenow="panel.width.value"
        tabindex="0"
        data-side-panel-resize
        :data-testid="resizeTestId"
        @pointerdown="resize.onPointerDown"
        @keydown="resize.onKeyDown"
      />
    </aside>

    <button
      v-if="showReopen && panel.reopenVisible.value"
      type="button"
      class="side-panel__reopen"
      :class="[reopenClass, `side-panel__reopen--${panel.side}`]"
      :aria-label="reopenLabel"
      :title="reopenLabel"
      data-side-panel-reopen
      :data-testid="reopenTestId"
      @click="panel.openPanel"
    >
      <slot name="reopen">
        <span class="side-panel__reopen-bar" />
        <span class="side-panel__reopen-bar" />
        <span class="side-panel__reopen-bar" />
      </slot>
    </button>
  </div>
</template>

<style>
.side-panel-host {
  --side-panel-z-index: 8501;
  --side-panel-backdrop-z-index: 8500;
  --side-panel-reopen-z-index: 8502;
  --side-panel-drawer-max-width: 28rem;
  --side-panel-background: Canvas;
  --side-panel-color: CanvasText;
  --side-panel-border-color: rgba(127, 127, 127, 0.25);
  --side-panel-shadow-left: 4px 0 18px rgba(0, 0, 0, 0.45);
  --side-panel-shadow-right: -4px 0 18px rgba(0, 0, 0, 0.45);
  --side-panel-padding-block: 0.5rem;
  --side-panel-padding-inline: 0.5rem;
  --side-panel-safe-top: 0px;
  --side-panel-safe-right: 0px;
  --side-panel-safe-bottom: 0px;
  --side-panel-safe-left: 0px;
  --side-panel-transition-duration: 250ms;
  --side-panel-close-size: 1.75rem;
  --side-panel-close-offset: 0.4rem;
  --side-panel-close-radius: 0.25rem;
  --side-panel-close-background: transparent;
  --side-panel-close-hover-background: rgba(127, 127, 127, 0.12);
  --side-panel-resize-target: 8px;
  --side-panel-resize-line: 2px;
  --side-panel-resize-color: rgba(127, 127, 127, 0.45);
  --side-panel-reopen-size: 1.875rem;
  --side-panel-reopen-offset: 0.75rem;
  --side-panel-reopen-padding: 0.375rem;
  --side-panel-reopen-gap: 0.2rem;
  --side-panel-reopen-radius: 0.375rem;
  --side-panel-reopen-background: var(--side-panel-background);
  --side-panel-reopen-color: var(--side-panel-color);
  --side-panel-reopen-border: var(--side-panel-border-color);
  --side-panel-backdrop-background: rgba(0, 0, 0, 0.45);
  display: contents;
}

.side-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  display: flex;
  width: var(--side-panel-current-width);
  min-width: 0;
  flex-direction: column;
  box-sizing: border-box;
  color: var(--side-panel-color);
  background: var(--side-panel-background);
  z-index: var(--side-panel-z-index);
  transition:
    transform var(--side-panel-transition-duration) ease-out,
    width var(--side-panel-transition-duration) ease-out,
    visibility 0s linear var(--side-panel-transition-duration);
  visibility: hidden;
  pointer-events: none;
}

.side-panel--left {
  left: 0;
  padding:
    calc(var(--side-panel-padding-block) + var(--side-panel-safe-top))
    var(--side-panel-padding-inline)
    calc(var(--side-panel-padding-block) + var(--side-panel-safe-bottom))
    calc(var(--side-panel-padding-inline) + var(--side-panel-safe-left));
  border-right: 1px solid var(--side-panel-border-color);
  box-shadow: var(--side-panel-shadow-left);
  transform: translateX(-100%);
}

.side-panel--right {
  right: 0;
  padding:
    calc(var(--side-panel-padding-block) + var(--side-panel-safe-top))
    calc(var(--side-panel-padding-inline) + var(--side-panel-safe-right))
    calc(var(--side-panel-padding-block) + var(--side-panel-safe-bottom))
    var(--side-panel-padding-inline);
  border-left: 1px solid var(--side-panel-border-color);
  box-shadow: var(--side-panel-shadow-right);
  transform: translateX(100%);
}

.side-panel--docked {
  box-shadow: none;
}

.side-panel--drawer {
  width: min(100vw, var(--side-panel-drawer-max-width));
}

.side-panel--contained.side-panel--docked {
  position: relative;
  inset: auto;
  width: 100%;
  height: 100%;
}

.side-panel--open {
  transform: translateX(0);
  visibility: visible;
  pointer-events: auto;
  transition:
    transform var(--side-panel-transition-duration) ease-out,
    width var(--side-panel-transition-duration) ease-out,
    visibility 0s;
}

.side-panel--dragging {
  transition: transform var(--side-panel-transition-duration) ease-out, width 0s, visibility 0s;
}

.side-panel--nudge {
  transition: transform var(--side-panel-transition-duration) ease-out, width 80ms ease-out, visibility 0s;
}

.side-panel__header,
.side-panel__footer {
  flex: 0 0 auto;
}

.side-panel__body {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.side-panel__footer {
  margin-top: auto;
}

.side-panel__close {
  position: absolute;
  top: calc(var(--side-panel-close-offset) + var(--side-panel-safe-top));
  width: var(--side-panel-close-size);
  height: var(--side-panel-close-size);
  display: grid;
  place-items: center;
  padding: 0;
  color: inherit;
  background: var(--side-panel-close-background);
  border: 0;
  border-radius: var(--side-panel-close-radius);
  cursor: pointer;
  z-index: 1;
}

.side-panel--left .side-panel__close {
  right: var(--side-panel-close-offset);
}

.side-panel--right .side-panel__close {
  left: var(--side-panel-close-offset);
}

.side-panel__close:hover {
  background: var(--side-panel-close-hover-background);
}

.side-panel__close svg {
  width: 1rem;
  height: 1rem;
}

.side-panel__backdrop {
  position: fixed;
  inset: 0;
  /* Explicit size: Chrome 91 leaves a fixed <button> 0px wide with
     `inset: 0` alone, so the scrim would neither dim nor catch taps. */
  width: 100%;
  height: 100%;
  padding: 0;
  background: var(--side-panel-backdrop-background);
  border: 0;
  z-index: var(--side-panel-backdrop-z-index);
}

.side-panel-backdrop-enter-active,
.side-panel-backdrop-leave-active {
  transition: opacity 200ms ease;
}

.side-panel-backdrop-enter-from,
.side-panel-backdrop-leave-to {
  opacity: 0;
}

.side-panel__resize {
  position: absolute;
  top: 0;
  bottom: 0;
  width: var(--side-panel-resize-target);
  cursor: col-resize;
  touch-action: none;
  outline: none;
  z-index: 2;
}

.side-panel__resize--left {
  right: calc(var(--side-panel-resize-target) / -2);
}

.side-panel__resize--right {
  left: calc(var(--side-panel-resize-target) / -2);
}

.side-panel__resize::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: var(--side-panel-resize-line);
  content: "";
  background: transparent;
  transition: background 150ms ease;
}

.side-panel__resize:hover::before,
.side-panel__resize:focus-visible::before,
.side-panel__resize--active::before {
  background: var(--side-panel-resize-color);
}

.side-panel__reopen {
  position: fixed;
  top: var(--side-panel-reopen-offset);
  width: var(--side-panel-reopen-size);
  height: var(--side-panel-reopen-size);
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: var(--side-panel-reopen-gap);
  padding: var(--side-panel-reopen-padding);
  color: var(--side-panel-reopen-color);
  background: var(--side-panel-reopen-background);
  border: 1px solid var(--side-panel-reopen-border);
  border-radius: var(--side-panel-reopen-radius);
  cursor: pointer;
  z-index: var(--side-panel-reopen-z-index);
}

.side-panel__reopen--left {
  left: var(--side-panel-reopen-offset);
}

.side-panel__reopen--right {
  right: var(--side-panel-reopen-offset);
}

.side-panel__reopen-bar {
  display: block;
  width: 100%;
  height: 2px;
  border-radius: 1px;
  background: currentColor;
}
</style>
