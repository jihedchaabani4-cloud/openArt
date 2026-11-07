# templates

## Overview
Component package providing implementations for `src/features/prompt-bar/templates`.

## Interface
- [character.template.js] `CHARACTER_PARAMETERS` (const)
- [character.template.js] `getSlots` (function)
- [character.template.js] `filterEligibleModels` (function)
- [character.template.js] `resolveParameterMapping` (function)
- [character.template.js] `createActions` (function)
- [character.template.js] `characterTemplate` (const)
- [character.template.js] `default` (default export)
- [CharacterPromptBar.jsx] `CharacterPromptBar` (function)
- [CharacterPromptBar.jsx] `default` (default export)
- [generatedMedia.template.js] `COMPOSITION_REQUIREMENTS` (const)
- [generatedMedia.template.js] `isFrameModel` (function)
- [generatedMedia.template.js] `isReferenceModel` (function)
- [generatedMedia.template.js] `filterEligibleModels` (function)
- [generatedMedia.template.js] `resolveParameterMapping` (function)
- [generatedMedia.template.js] `getSlots` (function)
- [generatedMedia.template.js] `createActions` (function)
- [generatedMedia.template.js] `generatedMediaType` (const)
- [generatedMedia.template.js] `generatedMediaTemplate` (const)
- [GeneratedPromptBar.jsx] `GeneratedPromptBar` (function)

## Invariants
- [generatedMedia.template.js] Throws error on invalid arguments or missing context.
- [generatedMedia.template.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- None

## Verification
- Run: `npm test`
