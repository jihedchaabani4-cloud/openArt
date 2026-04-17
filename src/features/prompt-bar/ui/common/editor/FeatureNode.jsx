import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, DecoratorNode } from "lexical";
import { MentionTag } from "./MentionTag";
import { useElementStore } from "../../../model/useElementStore";

function FeatureComponent({ nodeKey, section, traitKey, value, label, mediaLink }) {
  const [editor] = useLexicalComposerContext();
  const openFeatureEditorForLabel = useElementStore((state) => state.openFeatureEditorForLabel);

  const handleRemove = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  return (
    <MentionTag
      imageUrl={mediaLink}
      imageName={label}
      onClick={() => openFeatureEditorForLabel(label)}
      onRemove={handleRemove}
    />
  );
}

/**
 * Custom Lexical Node for Feature Tags (Character attributes).
 * Stores section/key/value and renders MentionTag as a decorator.
 */
export class FeatureNode extends DecoratorNode {
  __section;
  __traitKey;
  __value;
  __label;
  __mediaLink;

  static getType() { return "feature-tag"; }

  static clone(node) {
    return new FeatureNode(
      node.__section,
      node.__traitKey,
      node.__value,
      node.__label,
      node.__mediaLink,
      node.__key
    );
  }

  constructor(section, traitKey, value, label, mediaLink, lexicalKey) {
    super(lexicalKey);
    this.__section = section;
    this.__traitKey = traitKey;
    this.__value = value;
    this.__label = label;
    this.__mediaLink = mediaLink;
  }

  createDOM() {
    const span = document.createElement("span");
    span.setAttribute("data-lexical-decorator", "true");
    span.style.display = 'inline-block';
    return span;
  }

  updateDOM() { return false; }

  static importJSON(data) {
    return new FeatureNode(
      data.section,
      data.traitKey,
      data.value,
      data.label,
      data.mediaLink
    );
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "feature-tag",
      section: this.__section,
      traitKey: this.__traitKey,
      value: this.__value,
      label: this.__label,
      mediaLink: this.__mediaLink,
      version: 1,
    };
  }

  isInline() { return true; }

  // Overload to inject the feature text into the raw prompt string for the AI LLM
  getTextContent() {
    return `<Trait: ${this.__label}>`;
  }

  getFeatureId() {
    return `${this.__section}-${this.__traitKey}-${this.__value}`;
  }

  getFeatureSource() {
    return { section: this.__section, key: this.__traitKey, value: this.__value };
  }

  decorate() {
    return (
      <FeatureComponent
        nodeKey={this.getKey()}
        section={this.__section}
        traitKey={this.__traitKey}
        value={this.__value}
        label={this.__label}
        mediaLink={this.__mediaLink}
      />
    );
  }
}

export function $createFeatureNode(section, key, value, label, mediaLink) {
  return new FeatureNode(section, key, value, label, mediaLink);
}

export function $isFeatureNode(node) {
  return node instanceof FeatureNode;
}
