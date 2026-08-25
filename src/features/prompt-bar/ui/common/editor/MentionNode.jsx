import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, DecoratorNode } from "lexical";
import { MentionTag } from "./MentionTag";

function MentionComponent({ nodeKey, imageUrl, imageIndex, imageName, assetId, assetType }) {
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
 * Custom Lexical Node for Mentions (Image / Character / Element Tags).
 * Stores metadata and renders MentionTag as a decorator.
 */
export class MentionNode extends DecoratorNode {
  __imageUrl;
  __imageIndex;
  __imageName;
  __assetId;
  __assetType;

  static getType() { return "mention"; }

  static clone(node) {
    return new MentionNode(
      node.__imageUrl,
      node.__imageIndex,
      node.__imageName,
      node.__assetId,
      node.__assetType,
      node.__key
    );
  }

  constructor(imageUrl, imageIndex, imageName, assetId, assetType = "media", key) {
    super(key);
    this.__imageUrl = imageUrl;
    this.__imageIndex = imageIndex;
    this.__imageName = imageName;
    this.__assetId = assetId;
    this.__assetType = String(assetType || "media").toLowerCase();
  }

  createDOM() {
    const span = document.createElement("span");
    span.setAttribute("data-lexical-decorator", "true");
    span.style.display = 'inline-block';
    return span;
  }

  updateDOM() { return false; }

  static importJSON(data) {
    return new MentionNode(
      data.imageUrl,
      data.imageIndex,
      data.imageName,
      data.assetId,
      data.assetType
    );
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "mention",
      imageUrl: this.__imageUrl,
      imageIndex: this.__imageIndex,
      imageName: this.__imageName,
      assetId: this.__assetId,
      assetType: this.__assetType,
      version: 1,
    };
  }

  isInline() { return true; }

  // Overload to inject the exact reference tag into the raw prompt string
  getTextContent() {
    if (this.__assetType.includes("character")) {
      return `<character:${this.__assetId}>`;
    }
    if (this.__assetType.includes("element")) {
      return `<element:${this.__assetId}>`;
    }
    return `<MediaAsset:${this.__assetId}>`;
  }

  getAssetId() {
    return this.__assetId;
  }

  getAssetType() {
    return this.__assetType;
  }

  decorate() {
    return (
      <MentionComponent
        nodeKey={this.getKey()}
        imageUrl={this.__imageUrl}
        imageIndex={this.__imageIndex}
        imageName={this.__imageName}
        assetId={this.__assetId}
        assetType={this.__assetType}
      />
    );
  }
}

export function $createMentionNode(url, index, name, assetId, assetType = "media") {
  return new MentionNode(url, index, name, assetId, assetType);
}

export function $isMentionNode(node) {
  return node instanceof MentionNode;
}
