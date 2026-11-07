# editor

## Overview
Component package providing implementations for `src/features/prompt-bar/ui/common/editor`.

## Interface
- [AtMentionMenu.jsx] `getReferenceCategory` (function)
- [AtMentionMenu.jsx] `AtMentionMenu` (function)
- [FeatureNode.jsx] `FeatureNode` (class)
- [FeatureNode.jsx] `$createFeatureNode` (function)
- [FeatureNode.jsx] `$isFeatureNode` (function)
- [MentionNode.jsx] `MentionNode` (class)
- [MentionNode.jsx] `$createMentionNode` (function)
- [MentionNode.jsx] `$isMentionNode` (function)
- [MentionPlugin.jsx] `MentionPlugin` (function)
- [MentionTag.jsx] `MentionTag` (function)
- [PromptEditor.jsx] `handlePromptEditorError` (function)
- [PromptEditor.jsx] `MODULE_VERSION` (const)
- [PromptEditor.jsx] `PromptEditor` (function)

### Subdirectories
- **[plugins](./plugins/README.md)**

## Invariants
- [AtMentionMenu.jsx] Guard clauses return `null` when required state or props are absent.
- [MentionPlugin.jsx] Guard clauses return `null` when required state or props are absent.
- [PromptEditor.jsx] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [AtMentionMenu.jsx] Registers global window/DOM event listeners.
- [MentionPlugin.jsx] Registers global window/DOM event listeners.

## Verification
- Run: `npm test`
