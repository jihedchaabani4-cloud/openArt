import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, DecoratorNode } from "lexical";
import { MentionTag } from "./MentionTag";

function MentionComponent({ nodeKey, imageUrl, imageIndex, imageName, assetId }) {
  const [editor] = useLexicalComposerContext();

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
      imageUrl={imageUrl}
      imageIndex={imageIndex}
      imageName={imageName}
      onRemove={handleRemove}
    />
  );
}

/**
 * Custom Lexical Node for Mentions (Image Tags).
 * Stores metadata and renders MentionTag as a decorator.
 */
export class MentionNode extends DecoratorNode {
  __imageUrl;
  __imageIndex;
  __imageName;
  __assetId;

  static getType() { return "mention"; }

  static clone(node) {
    return new MentionNode(node.__imageUrl, node.__imageIndex, node.__imageName, node.__assetId, node.__key);
  }

  constructor(imageUrl, imageIndex, imageName, assetId, key) {
    super(key);
    this.__imageUrl = imageUrl;
    this.__imageIndex = imageIndex;
    this.__imageName = imageName;
    this.__assetId = assetId;
  }

  createDOM() {
    const span = document.createElement("span");
    span.setAttribute("data-lexical-decorator", "true");
    span.style.display = 'inline-block';
    return span;
  }

  updateDOM() { return false; }

  static importJSON(data) {
    return new MentionNode(data.imageUrl, data.imageIndex, data.imageName, data.assetId);
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "mention",
      imageUrl: this.__imageUrl,
      imageIndex: this.__imageIndex,
      imageName: this.__imageName,
      assetId: this.__assetId,
      version: 1,
    };
  }

  isInline() { return true; }

  // Overload to inject the reference tag text into the raw prompt string for the AI LLM
  getTextContent() {
    return `<MediaAsset:${this.__assetId}>`;
  }

  getAssetId() {
    return this.__assetId;
  }

  decorate() {
    return (
      <MentionComponent
        nodeKey={this.getKey()}
        imageUrl={this.__imageUrl}
        imageIndex={this.__imageIndex}
        imageName={this.__imageName}
        assetId={this.__assetId}
      />
    );
  }
}

export function $createMentionNode(url, index, name, assetId) {
  return new MentionNode(url, index, name, assetId);
}

export function $isMentionNode(node) {
  return node instanceof MentionNode;
}
