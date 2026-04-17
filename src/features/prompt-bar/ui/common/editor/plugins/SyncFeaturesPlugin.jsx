import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createParagraphNode } from "lexical";
import { $createFeatureNode, $isFeatureNode } from "../FeatureNode";
import { useElementStore } from "../../../../model/useElementStore";
import { getFeatureInfo } from "../../../../model/feature-constants";

export function SyncFeaturesPlugin() {
  const [editor] = useLexicalComposerContext();
  const features = useElementStore((state) => state.features);
  const updateFeature = useElementStore((state) => state.updateFeature);

  const featuresRef = useRef(features);
  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  useEffect(() => {
    const selectedList = [];

    if (features.era) {
      selectedList.push({ section: "era", key: null, value: features.era });
    }
    if (features.renderingStyle) {
      selectedList.push({ section: "renderingStyle", key: null, value: features.renderingStyle });
    }

    Object.entries(features.identity).forEach(([key, value]) => {
      if (value) selectedList.push({ section: "identity", key, value });
    });
    Object.entries(features.head).forEach(([key, value]) => {
      if (value) selectedList.push({ section: "head", key, value });
    });
    Object.entries(features.details).forEach(([key, value]) => {
      if (value) selectedList.push({ section: "details", key, value });
    });
    if (features.outfit) {
      selectedList.push({ section: "outfit", key: null, value: features.outfit });
    }

    editor.update(() => {
      const root = $getRoot();
      const existingFeatures = new Map();

      root.getChildren().forEach((child) => {
        if (child.getType() !== "paragraph") return;
        child.getChildren().forEach((node) => {
          if ($isFeatureNode(node)) {
            existingFeatures.set(node.getFeatureId(), node);
          }
        });
      });

      const selectedIds = new Set(selectedList.map((feature) => `${feature.section}-${feature.key}-${feature.value}`));

      existingFeatures.forEach((node, id) => {
        if (!selectedIds.has(id)) {
          node.remove();
        }
      });

      selectedList.forEach((feature) => {
        const featureId = `${feature.section}-${feature.key}-${feature.value}`;
        if (existingFeatures.has(featureId)) return;

        const info = getFeatureInfo(feature.section, feature.key, feature.value);
        if (!info) return;

        const node = $createFeatureNode(feature.section, feature.key, feature.value, info.label, info.mediaLink);

        let paragraph = $getRoot().getFirstChild();
        if (!paragraph || paragraph.getType() !== "paragraph") {
          paragraph = $createParagraphNode();
          $getRoot().append(paragraph);
        }

        paragraph.append(node);
      });
    });
  }, [editor, features]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const currentFeatureIds = new Set();

        root.getChildren().forEach((child) => {
          if (child.getType() !== "paragraph") return;
          child.getChildren().forEach((node) => {
            if ($isFeatureNode(node)) {
              currentFeatureIds.add(node.getFeatureId());
            }
          });
        });

        const activeFeatures = featuresRef.current;
        const checkAndUnselect = (section, key, value) => {
          if (!value) return;
          const featureId = `${section}-${key}-${value}`;
          if (!currentFeatureIds.has(featureId)) {
            updateFeature(section, key, value);
          }
        };

        checkAndUnselect("era", null, activeFeatures.era);
        checkAndUnselect("renderingStyle", null, activeFeatures.renderingStyle);
        Object.entries(activeFeatures.identity).forEach(([key, value]) => checkAndUnselect("identity", key, value));
        Object.entries(activeFeatures.head).forEach(([key, value]) => checkAndUnselect("head", key, value));
        Object.entries(activeFeatures.details).forEach(([key, value]) => checkAndUnselect("details", key, value));
        checkAndUnselect("outfit", null, activeFeatures.outfit);
      });
    });
  }, [editor, updateFeature]);

  return null;
}
