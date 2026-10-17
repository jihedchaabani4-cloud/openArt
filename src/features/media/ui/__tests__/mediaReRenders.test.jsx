import React from "react";
import { describe, it, expect } from "vitest";
import { render, act } from "@testing-library/react";
import { MediaTile } from "../MediaTile";
import { MediaCard } from "../MediaCard";
import { buildProjectMediaIndex } from "@/features/workflows/model/mediaCacheIndex";

describe("Media Presentation Memoization & Re-renders (100 Tiles)", () => {
  it("only re-renders the 1 tile whose media changed when 1 of 100 workflows updates", () => {
    // 1. Build initial mock payload of 100 workflows and 100 media rows
    const workflows = [];
    const rawMedia = [];
    for (let i = 0; i < 100; i++) {
      workflows.push({ id: `wf-${i}`, workflow_type: "GENERATION" });
      rawMedia.push({
        id: `media-${i}`,
        workflow_id: `wf-${i}`,
        url: `https://example.com/asset-${i}.png`,
        role: "output",
        status: "ready",
      });
    }

    let projectData = {
      projectContents: {
        workflows,
        media: rawMedia,
      },
    };

    let index = buildProjectMediaIndex(projectData);

    // Track render counts per tile ID
    const renderCounts = {};

    const MonitoredTile = React.memo(function MonitoredTile({ item }) {
      renderCounts[item.id] = (renderCounts[item.id] || 0) + 1;
      return <MediaTile item={item} />;
    });

    function Gallery({ mediaIndex }) {
      const items = Array.from(mediaIndex.byMediaId.values());
      return (
        <div data-testid="gallery-grid">
          {items.map((it) => (
            <MonitoredTile key={it.id} item={it} />
          ))}
        </div>
      );
    }

    // Initial render
    const { rerender } = render(<Gallery mediaIndex={index} />);

    // Verify all 100 tiles rendered exactly once
    expect(Object.keys(renderCounts)).toHaveLength(100);
    for (let i = 0; i < 100; i++) {
      expect(renderCounts[`media-${i}`]).toBe(1);
    }

    // 2. Mutate exactly ONE workflow's media (wf-42 / media-42), keeping the other 99 identical in memory
    const updatedRawMedia = rawMedia.map((m, idx) => {
      if (idx === 42) {
        return {
          ...m,
          url: "https://example.com/asset-42-updated.png",
        };
      }
      return m; // unchanged reference in memory
    });

    const updatedProjectData = {
      projectContents: {
        workflows,
        media: updatedRawMedia,
      },
    };

    const newIndex = buildProjectMediaIndex(updatedProjectData);

    // Re-render gallery with new index
    act(() => {
      rerender(<Gallery mediaIndex={newIndex} />);
    });

    // 3. Verify: EXACTLY 1 tile re-rendered (renderCounts['media-42'] is 2)
    // The other 99 tiles did NOT re-render (renderCounts remain 1)!
    expect(renderCounts["media-42"]).toBe(2);
    for (let i = 0; i < 100; i++) {
      if (i !== 42) {
        expect(renderCounts[`media-${i}`]).toBe(1);
      }
    }
  });

  it("MediaCard memoization prevents re-rendering when item reference is identical", () => {
    const item = {
      id: "media-card-1",
      url: "https://example.com/photo.png",
      kind: "image",
      status: "ready",
    };

    let renderCount = 0;
    const MonitoredCard = React.memo(function MonitoredCard({ item }) {
      renderCount++;
      return <MediaCard item={item} />;
    });

    function Container({ item }) {
      return <MonitoredCard item={item} />;
    }

    const { rerender } = render(<Container item={item} />);
    expect(renderCount).toBe(1);

    // Re-render with same item reference
    rerender(<Container item={item} />);
    expect(renderCount).toBe(1);

    // Re-render with new item reference
    const newItem = { ...item, url: "https://example.com/new-photo.png" };
    rerender(<Container item={newItem} />);
    expect(renderCount).toBe(2);
  });
});
