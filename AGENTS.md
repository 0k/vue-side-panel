# @0k/vue-side-panel

Shared Vue 3 panel chrome and controller extracted from Vigil-UI. The package
owns responsive dock/drawer behavior, persistent collapse and width state,
drawer grouping, resize interaction, backdrop/Escape dismissal, and accessible
chrome. Hosts own domain content, grid reservation, labels, storage keys,
persistence adapters, and theme values.

## Rules

- Keep the single responsive query at `(min-width: 75rem)`.
- Drawer state is transient; desktop collapse and width may be persisted.
- Storage and native persistence failures must never prevent in-memory use.
- A drawer group has one open panel or none; never independent open booleans.
- Pointer resize must clean up on pointer-up, pointer-cancel, and unmount.
- Keep all visible strings configurable for host gettext integration.
- Do not add domain navigation, data fetching, routing, or host themes.
- Write specification tests first and run `npm run check` before delivery.
