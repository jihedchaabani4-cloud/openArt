# UI Components (`src/components`)

Consolidated architecture for all UI components across the application.

## Directory Structure

```text
src/components/
├── base/                    # The 12 canonical DESIGN.md Base Primitives (button, icon-button, select, dropdown-menu, pill-tabs, section-card, accordion, dashed-upload-slot, interactive-list-row, switch, input, checkbox, badge)
├── primitives/              # Shared low-level Radix/UI helpers (dialog, textarea, tooltip, popover, slider, skeleton, avatar, card, context-menu, hover-card, radio-group, collapsible, LoadingScreen, ConfirmDeleteDialog, HugeIcon, etc.)
├── layout/                  # App shell, navigation, auth & shared drawers (StudioLayout, StudioNavbar, NavbarCore, LoginDialog, HowToDrawer, etc.)
└── cinema-studio/           # Cinema Studio domain components grouped by feature:
    ├── prompt-bar/          # Prompt bar & settings components (FlowPromptBoxSettings, StudioSettingsDropdown, BaseSelector, etc.)
    ├── media/               # Media grids, ProcessingCard, galleries, preview cards
    ├── characters/          # Character creation & management components
    ├── elements/            # Elements components
    ├── assets/              # Assets library & detail components
    ├── collections/         # Collection cards & dialogs (CreateFolderDialog, MoveToDialog, etc.)
    └── projects/            # Project list & creation components
```

## Architectural Guidelines
1. **Zero Legacy CSS**: Pure token alignment via `.ds-*` utility classes and canonical design tokens. Zero inline visual styling, arbitrary gray scales, or legacy prefixes.
2. **Deep Modules**: Expose clean, minimal interfaces with encapsulated domain implementations.
3. **No Deprecated Shims**: Always import directly from canonical module paths (`@/components/base/*`, `@/components/primitives/*`, `@/components/layout/*`, `@/components/cinema-studio/*`).
