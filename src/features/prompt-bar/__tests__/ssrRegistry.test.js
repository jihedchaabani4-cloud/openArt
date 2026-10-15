// @vitest-environment node
import React from "react";
import ReactDOMServer from "react-dom/server";
import { describe, it, expect, beforeEach } from "vitest";
import { PromptBarStoreProvider, usePromptBarStoreInstance } from "../store/PromptBarStoreContext.js";
import { registry } from "../store/registry.js";

describe("B2: SSR Registry Isolation", () => {
  beforeEach(() => {
    // Clear registry before test
    const items = registry.list();
    for (const item of items) {
      registry.dispose(item.key);
    }
  });

  it("server render of the provider for N different projectIds leaves the registry empty", () => {
    expect(registry.list().length).toBe(0);

    const N = 10;
    for (let i = 0; i < N; i++) {
      const tree = React.createElement(PromptBarStoreProvider, {
        projectId: `proj_ssr_${i}`,
        type: { id: "generated-media", defaultModel: "m1" },
        children: React.createElement("div", null, `Child ${i}`),
      });
      ReactDOMServer.renderToString(tree);
    }

    // Must NOT leak entries into the module-level registry on the server
    expect(registry.list().length).toBe(0);
  });

  it("server rendered component can access the store instance and read default state", () => {
    let capturedState = null;

    function TestConsumer() {
      const store = usePromptBarStoreInstance();
      capturedState = store.getState();
      return React.createElement("span", null, capturedState.activeMode);
    }

    const html = ReactDOMServer.renderToString(
      React.createElement(PromptBarStoreProvider, {
        projectId: "proj_ssr_consumer",
        type: { id: "generated-media", defaultModel: "m1" },
        children: React.createElement(TestConsumer),
      })
    );

    expect(html).toContain("image");
    expect(capturedState).not.toBeNull();
    expect(capturedState.activeMode).toBe("image");
    expect(registry.list().length).toBe(0);
  });
});
