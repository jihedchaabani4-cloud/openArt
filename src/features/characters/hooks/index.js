// [FSD Layer: features/characters/hooks] — Barrel for characters domain hooks.
// Exports follow the 1 hook / file split rule; exact names from baseline.md §0.2 T5.
// 2 queries  + 7 mutations = baseline 9 named hooks.
export { useCharacter, default } from "./useCharacter";
export { useCharacterWorkflows } from "./useCharacterWorkflows";
export { useCreateCharacterMutation } from "./useCreateCharacterMutation";
export { useUpdateCharacter } from "./useUpdateCharacter";
export { useGenerateCharacterSheetMutation } from "./useGenerateCharacterSheetMutation";
export { useGenerateCharacterDescriptionMutation } from "./useGenerateCharacterDescriptionMutation";
export { useAddMediaToCharacter } from "./useAddMediaToCharacter";
export { useRemoveMediaFromCharacter } from "./useRemoveMediaFromCharacter";
export { useSetCharacterSheetMedia } from "./useSetCharacterSheetMedia";
