import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createTextNode, $getSelection, $isRangeSelection, $createParagraphNode } from "lexical";
import { $createFeatureNode, $isFeatureNode } from "../FeatureNode";
import { useElementStore } from "../../../../model/useElementStore";
import { getFeatureInfo } from "../../../../model/feature-constants";

export function SyncFeaturesPlugin() {
  const [editor] = useLexicalComposerContext();
  const features = useElementStore((state) => state.features);
  const updateFeature = useElementStore((state) => state.updateFeature);
  
  // Use a ref for features to avoid constant update listener re-attachement
  const featuresRef = useRef(features);
  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  // 1. Store -> Editor: Inject tags for selected features
  useEffect(() => {
    // Flatten selected features
    const selectedList = [];
    Object.entries(features.identity).forEach(([key, value]) => {
      if (value) selectedList.push({ section: 'identity', key, value });
    });
    Object.entries(features.appearance).forEach(([key, value]) => {
      if (value) selectedList.push({ section: 'appearance', key, value });
    });
    if (features.outfit) {
      selectedList.push({ section: 'outfit', key: null, value: features.outfit });
    }

    editor.update(() => {
      const root = $getRoot();
      const existingFeatures = new Map();
      
      // Find all existing feature nodes
      root.getChildren().forEach(child => {
        if (child.getType() === 'paragraph') {
          child.getChildren().forEach(node => {
            if ($isFeatureNode(node)) {
              existingFeatures.set(node.getFeatureId(), node);
            }
          });
        }
      });

      const selectedIds = new Set(selectedList.map(f => `${f.section}-${f.key}-${f.value}`));

      // Check for nodes to remove
      existingFeatures.forEach((node, id) => {
        if (!selectedIds.has(id)) {
          node.remove();
        }
      });

      // Check for nodes to add
      selectedList.forEach(feat => {
        const featId = `${feat.section}-${feat.key}-${feat.value}`;
        if (!existingFeatures.has(featId)) {
          const info = getFeatureInfo(feat.section, feat.key, feat.value);
          if (info) {
            const node = $createFeatureNode(
              feat.section,
              feat.key,
              feat.value,
              info.label,
              info.mediaLink
            );
            
            let paragraph = root.getFirstChild();
            if (!paragraph || paragraph.getType() !== 'paragraph') {
              paragraph = $createParagraphNode();
              root.append(paragraph);
            }
            
            paragraph.append(node);
          }
        }
      });
    });
  }, [features, editor]);

  // 2. Editor -> Store: Unselect feature if tag is deleted
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const currentFeatureIds = new Set();
        
        root.getChildren().forEach(child => {
          if (child.getType() === 'paragraph') {
            child.getChildren().forEach(node => {
              if ($isFeatureNode(node)) {
                currentFeatureIds.add(node.getFeatureId());
              }
            });
          }
        });

        const activeFeatures = featuresRef.current;

        const checkAndUnselect = (section, key, value) => {
          if (!value) return;
          const featId = `${section}-${key}-${value}`;
          if (!currentFeatureIds.has(featId)) {
            // Only update if it's missing from editor but PRESENT in store
            updateFeature(section, key, value);
          }
        };

        Object.entries(activeFeatures.identity).forEach(([key, value]) => checkAndUnselect('identity', key, value));
        Object.entries(activeFeatures.appearance).forEach(([key, value]) => checkAndUnselect('appearance', key, value));
        checkAndUnselect('outfit', null, activeFeatures.outfit);
      });
    });
  }, [editor, updateFeature]);

  return null;
}
