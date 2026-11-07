# hooks

## Overview
Component package providing implementations for `src/features/characters/hooks`.

## Interface
- [index.js] `useCharacter` (re-export)
- [index.js] `default` (re-export)
- [index.js] `useCharacterWorkflows` (re-export)
- [index.js] `useCreateCharacterMutation` (re-export)
- [index.js] `useUpdateCharacter` (re-export)
- [index.js] `useGenerateCharacterSheetMutation` (re-export)
- [index.js] `useGenerateCharacterDescriptionMutation` (re-export)
- [index.js] `useAddMediaToCharacter` (re-export)
- [index.js] `useRemoveMediaFromCharacter` (re-export)
- [index.js] `useSetCharacterSheetMedia` (re-export)
- [useAddMediaToCharacter.js] `useAddMediaToCharacter` (function)
- [useAddMediaToCharacter.js] `default` (default export)
- [useCharacter.js] `useCharacter` (function)
- [useCharacter.js] `default` (default export)
- [useCharacterWorkflows.js] `useCharacterWorkflows` (function)
- [useCreateCharacterMutation.js] `useCreateCharacterMutation` (function)
- [useGenerateCharacterDescriptionMutation.js] `useGenerateCharacterDescriptionMutation` (function)
- [useGenerateCharacterSheetMutation.js] `useGenerateCharacterSheetMutation` (function)
- [useRemoveMediaFromCharacter.js] `useRemoveMediaFromCharacter` (function)
- [useRemoveMediaFromCharacter.js] `default` (default export)
- [useSetCharacterSheetMedia.js] `useSetCharacterSheetMedia` (function)
- [useSetCharacterSheetMedia.js] `default` (default export)
- [useUpdateCharacter.js] `useUpdateCharacter` (function)
- [useUpdateCharacter.js] `default` (default export)

## Invariants
- [useAddMediaToCharacter.js] Preserves optimistic rollback invariants on mutation failure.
- [useCharacter.js] Throws error on invalid arguments or missing context.
- [useCharacter.js] Guard clauses return `null` when required state or props are absent.
- [useCharacter.js] Preserves optimistic rollback invariants on mutation failure.
- [useCreateCharacterMutation.js] Preserves optimistic rollback invariants on mutation failure.
- [useRemoveMediaFromCharacter.js] Preserves optimistic rollback invariants on mutation failure.
- [useSetCharacterSheetMedia.js] Preserves optimistic rollback invariants on mutation failure.
- [useUpdateCharacter.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [useAddMediaToCharacter.js] Mutates React Query cache.
- [useCreateCharacterMutation.js] Mutates React Query cache.
- [useGenerateCharacterSheetMutation.js] Mutates React Query cache.

## Verification
- Run: `npm test`
