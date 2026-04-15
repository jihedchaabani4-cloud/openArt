import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TextNode, $createTextNode } from "lexical";
import { $createFeatureNode } from "../FeatureNode";
import { getFeatureInfoFromLabel } from "../../../../model/feature-constants";
import { useElementStore } from "../../../../model/useElementStore";

/**
 * TextTagConverterPlugin
 *
 * Scans TextNodes for patterns like <Trait: Male> or <Trait:Male>
 * and converts them in-place into proper visual FeatureNode chips.
 *
 * Also auto-selects the feature in the store if it isn't already selected.
 */
export function TextTagConverterPlugin() {
  const [editor] = useLexicalComposerContext();
  const updateFeature = useElementStore((s) => s.updateFeature);

  useEffect(() => {
    // registerNodeTransform is the cleanest Lexical API for this —
    // it fires after every mutation and lets you transform a node in place.
    return editor.registerNodeTransform(TextNode, (textNode) => {
      const text = textNode.getTextContent();
      // Match <Trait: Label> or <Trait:Label> (case insensitive)
      const TRAIT_REGEX = /<Trait:\s*([^>]+)>/i;
      const match = TRAIT_REGEX.exec(text);

      if (!match) return; // Nothing to convert in this node

      const fullMatch = match[0];           // e.g. "<Trait: Male>"
      const labelRaw = match[1].trim();     // e.g. "Male"
      const startIdx = match.index;
      const endIdx = startIdx + fullMatch.length;

      // Look up the full feature context from the label
      const featureInfo = getFeatureInfoFromLabel(labelRaw);

      if (!featureInfo) {
        // Unknown label — leave as plain text so user can see it
        return;
      }

      // Split the TextNode into: [before] [FeatureChip] [after]
      const before = text.slice(0, startIdx);
      const after  = text.slice(endIdx);

      // Replace current node with the before-text + chip + after-text
      const featureNode = $createFeatureNode(
        featureInfo.section,
        featureInfo.key,
        featureInfo.value,
        featureInfo.label,
        featureInfo.mediaLink || null
      );

      if (before) {
        textNode.insertBefore($createTextNode(before));
      }
      textNode.insertBefore(featureNode);
      if (after) {
        textNode.replace($createTextNode(after));
      } else {
        textNode.remove();
      }

      // Auto-select this feature in the Zustand store if it isn't already
      updateFeature(featureInfo.section, featureInfo.key, featureInfo.value);
    });
  }, [editor, updateFeature]);

  return null;
}
