import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TextNode, $createTextNode, $getRoot } from "lexical";
import { $createFeatureNode } from "../FeatureNode";
import { $createMentionNode } from "../MentionNode";
import { getFeatureInfoFromLabel } from "../../../../model/feature-constants";
import { useElementStore } from "../../../../model/useElementStore";

/**
 * TextTagConverterPlugin
 *
 * Scans TextNodes for:
 * 1. <Trait: Label> -> FeatureNode (Chip)
 * 2. <MediaAsset: uuid> -> MentionNode (Image Chip)
 *
 * Performs in-place conversion and ensures store state is updated.
 */
export function TextTagConverterPlugin({ referenceImages = [] }) {
  const [editor] = useLexicalComposerContext();
  const updateFeature = useElementStore((s) => s.updateFeature);

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (textNode) => {
      const text = textNode.getTextContent();
      
      // 1. Match Trait Tags: <Trait: Male>
      const TRAIT_REGEX = /<Trait:\s*([^>]+)>/i;
      const traitMatch = TRAIT_REGEX.exec(text);

      if (traitMatch) {
        const fullMatch = traitMatch[0];
        const labelRaw = traitMatch[1].trim();
        const startIdx = traitMatch.index;
        const endIdx = startIdx + fullMatch.length;

        const featureInfo = getFeatureInfoFromLabel(labelRaw);
        if (featureInfo) {
          // Exclusivity Check: Remove other chips in the same category
          if (featureInfo.key || featureInfo.section === 'outfit') {
            const root = $getRoot();
            root.getChildren().forEach(child => {
              if (child.getType() === 'paragraph') {
                child.getChildren().forEach(node => {
                  if (node.getType() === 'feature-tag') {
                    if (node.__section === featureInfo.section && node.__traitKey === featureInfo.key) {
                      node.remove();
                    }
                  }
                });
              }
            });
          }

          const chip = $createFeatureNode(
            featureInfo.section, featureInfo.key, featureInfo.value, 
            featureInfo.label, featureInfo.mediaLink || null
          );
          
          replaceWithNode(textNode, text, startIdx, endIdx, chip);
          updateFeature(featureInfo.section, featureInfo.key, featureInfo.value, true);
          return;
        }
      }

      // 2. Match Media Tags: <MediaAsset: 752de845-...>
      const MEDIA_REGEX = /<MediaAsset:\s*([a-f0-9-]+)>/i;
      const mediaMatch = MEDIA_REGEX.exec(text);

      if (mediaMatch) {
        const fullMatch = mediaMatch[0];
        const assetId = mediaMatch[1].trim();
        const startIdx = mediaMatch.index;
        const endIdx = startIdx + fullMatch.length;

        // Resolve metadata from current references
        const asset = referenceImages.find(img => img.asset_id === assetId);
        
        if (asset) {
          const chip = $createMentionNode(
            asset.url, 
            0, 
            asset.displayName || asset.name || "Ref", 
            asset.asset_id
          );
          
          replaceWithNode(textNode, text, startIdx, endIdx, chip);
          return; 
        }
      }
    });
  }, [editor, updateFeature, referenceImages]);

  return null;
}

/**
 * Helper to split a TextNode and insert a chip in the middle
 */
function replaceWithNode(textNode, fullText, start, end, newNode) {
  const before = fullText.slice(0, start);
  const after  = fullText.slice(end);

  if (before) {
    textNode.insertBefore($createTextNode(before));
  }
  textNode.insertBefore(newNode);
  if (after) {
    textNode.replace($createTextNode(after));
  } else {
    textNode.remove();
  }
}
