# ui

## Overview
Component package providing implementations for `src/widgets/StudioNavbar/ui`.

## Interface
- [NavbarImportButton.jsx] `NavbarImportButton` (function)
- [NavbarRestoreAllButton.jsx] `NavbarRestoreAllButton` (function)
- [NavbarRestoreAllButton.jsx] `default` (default export)
- [StudioNavbarCenter.jsx] `StudioNavbarCenter` (function)
- [StudioNavbarLeft.jsx] `StudioNavbarLeft` (function)
- [StudioNavbarRight.jsx] `StudioNavbarRight` (const)
- [StudioSettingsDropdown.jsx] `StudioSettingsDropdown` (function)

## Invariants
- [NavbarImportButton.jsx] Guard clauses return `null` when required state or props are absent.
- [NavbarRestoreAllButton.jsx] Guard clauses return `null` when required state or props are absent.
- [StudioNavbarLeft.jsx] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [StudioNavbarLeft.jsx] Registers global window/DOM event listeners.

## Verification
- Run: `npm test`
