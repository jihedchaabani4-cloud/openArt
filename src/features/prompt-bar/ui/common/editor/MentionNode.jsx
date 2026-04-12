import React from 'react';
import {
  DecoratorNode,
} from "lexical";
import { MentionTag } from "./MentionTag";

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

  getAssetId() {
    return this.__assetId;
  }

  decorate() {
    return (
      <MentionTag
        imageUrl={this.__imageUrl}
        imageIndex={this.__imageIndex}
        imageName={this.__imageName}
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
