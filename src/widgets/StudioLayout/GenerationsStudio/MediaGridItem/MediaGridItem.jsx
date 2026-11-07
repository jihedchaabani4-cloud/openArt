import React from "react";
import { CollectionMediaGridItem, CollectionGridItem } from "./CollectionMediaGridItem";
import { TrashMediaGridCard } from "./TrashMediaGridCard";
import { StudioMediaGridCard } from "./StudioMediaGridCard";

// Canonical design tokens enforced across child cards:
// - Corner radius geometry: rounded-xxxs
// - Action controls: ButtonGroup variant="pill"

export const WorkflowMediaGridItem = React.memo(function WorkflowMediaGridItem(props) {
  if (props.isTrash || props.workflow?.deleted_at || props.item?.deleted_at || props.media?.deleted_at) {
    return <TrashMediaGridCard {...props} />;
  }
  return <StudioMediaGridCard {...props} />;
});

export const MediaGridItem = React.memo(function MediaGridItem(props) {
  if (
    props.itemType === "collection" ||
    props.collection ||
    props.workflow?.type === "collection" ||
    props.workflow?.isCollection
  ) {
    return <CollectionMediaGridItem {...props} />;
  }

  if (props.isTrash || props.workflow?.deleted_at || props.item?.deleted_at || props.media?.deleted_at) {
    return <TrashMediaGridCard {...props} />;
  }

  return <StudioMediaGridCard {...props} />;
});

export {
  CollectionMediaGridItem,
  CollectionGridItem,
  StudioMediaGridCard,
  TrashMediaGridCard,
};

export default MediaGridItem;
