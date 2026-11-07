import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import {
  MediaGridItem,
  WorkflowMediaGridItem,
  CollectionMediaGridItem,
  CollectionGridItem,
  StudioMediaGridCard,
  TrashMediaGridCard,
} from "../MediaGridItem";

vi.mock("../CollectionMediaGridItem", () => ({
  CollectionMediaGridItem: (props) => (
    <div data-testid="collection-card" data-props={JSON.stringify(props)}>
      Collection Card
    </div>
  ),
  CollectionGridItem: (props) => (
    <div data-testid="collection-card" data-props={JSON.stringify(props)}>
      Collection Card
    </div>
  ),
}));

vi.mock("../TrashMediaGridCard", () => ({
  TrashMediaGridCard: (props) => (
    <div data-testid="trash-card" data-props={JSON.stringify(props)}>
      Trash Card
    </div>
  ),
}));

vi.mock("../StudioMediaGridCard", () => ({
  StudioMediaGridCard: (props) => (
    <div data-testid="studio-card" data-props={JSON.stringify(props)}>
      Studio Card
    </div>
  ),
}));

describe("MediaGridItem Dispatcher & Facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("exports all canonical cards and aliases", () => {
    expect(MediaGridItem).toBeDefined();
    expect(WorkflowMediaGridItem).toBeDefined();
    expect(CollectionMediaGridItem).toBeDefined();
    expect(CollectionGridItem).toBeDefined();
    expect(StudioMediaGridCard).toBeDefined();
    expect(TrashMediaGridCard).toBeDefined();
  });

  it("routes to CollectionMediaGridItem when itemType is collection", () => {
    render(
      <MediaGridItem
        itemType="collection"
        collection={{ id: "col-1", name: "Folder" }}
      />
    );
    expect(screen.getByTestId("collection-card")).toBeDefined();
  });

  it("routes to CollectionMediaGridItem when workflow.type is collection", () => {
    render(
      <MediaGridItem
        workflow={{ id: "col-2", type: "collection", name: "Folder 2" }}
      />
    );
    expect(screen.getByTestId("collection-card")).toBeDefined();
  });

  it("routes to TrashMediaGridCard when isTrash is true", () => {
    render(
      <MediaGridItem
        isTrash={true}
        workflow={{ id: "wf-1", display_name: "Trashed WF" }}
      />
    );
    expect(screen.getByTestId("trash-card")).toBeDefined();
  });

  it("routes to TrashMediaGridCard when workflow.deleted_at is present", () => {
    render(
      <MediaGridItem
        workflow={{ id: "wf-2", deleted_at: "2026-11-06T10:00:00Z" }}
      />
    );
    expect(screen.getByTestId("trash-card")).toBeDefined();
  });

  it("routes to StudioMediaGridCard for active generations", () => {
    render(
      <MediaGridItem
        workflow={{ id: "wf-3", display_name: "Active Generation" }}
      />
    );
    expect(screen.getByTestId("studio-card")).toBeDefined();
  });

  it("WorkflowMediaGridItem routes correctly to TrashMediaGridCard or StudioMediaGridCard", () => {
    const { unmount } = render(
      <WorkflowMediaGridItem
        isTrash={true}
        workflow={{ id: "wf-4" }}
      />
    );
    expect(screen.getByTestId("trash-card")).toBeDefined();
    unmount();

    render(
      <WorkflowMediaGridItem
        workflow={{ id: "wf-5" }}
      />
    );
    expect(screen.getByTestId("studio-card")).toBeDefined();
  });
});
