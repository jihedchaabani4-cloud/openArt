import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { PromptEditor, handlePromptEditorError } from "../ui/common/editor/PromptEditor.jsx";
import { logger } from "@/shared/lib/logger";

describe("PromptEditor Clean Code & Logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handlePromptEditorError delegates to logger.error and never calls console.error", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const loggerErrorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    const testErr = new Error("Lexical test crash");
    handlePromptEditorError(testErr);

    expect(loggerErrorSpy).toHaveBeenCalledWith("prompt_editor_error", { error: testErr });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("renders custom plugins passed via plugins prop without hardcoding character plugins", () => {
    let pluginMounted = false;
    function CustomTestPlugin() {
      React.useEffect(() => {
        pluginMounted = true;
      }, []);
      return <span data-testid="custom-test-plugin" />;
    }

    render(
      <PromptEditor
        value="test"
        onChange={() => {}}
        plugins={<CustomTestPlugin />}
      />
    );

    expect(screen.getByTestId("custom-test-plugin")).toBeDefined();
    expect(pluginMounted).toBe(true);
  });

  it("preserves LexicalComposer DOM node and editor instance across re-renders (no remount)", () => {
    const { rerender, container } = render(
      <PromptEditor value="initial" onChange={() => {}} />
    );
    const contentEditableFirst = container.querySelector('[contenteditable="true"]');
    expect(contentEditableFirst).toBeDefined();

    rerender(<PromptEditor value="updated" onChange={() => {}} />);
    const contentEditableSecond = container.querySelector('[contenteditable="true"]');

    // With a stable editorKey (useId), LexicalComposer does not remount on re-renders
    expect(contentEditableSecond).toBe(contentEditableFirst);
  });
});
