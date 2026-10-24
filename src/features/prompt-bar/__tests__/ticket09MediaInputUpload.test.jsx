import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MediaInput } from "../ui/common/MediaInput.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "proj-media-test" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/cinema-studio/proj-media-test",
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Ticket 09: MediaInput Real Upload and State Transitions", () => {
  let createObjectURLMock;
  let revokeObjectURLMock;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURLMock = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/temp-preview");
    revokeObjectURLMock = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    createObjectURLMock.mockRestore();
    revokeObjectURLMock.mockRestore();
  });

  it("transitions through idle -> uploading -> ready on successful file drop", async () => {
    const onChange = vi.fn();
    const deferredPromise = {};
    const mockUpload = vi.fn(() => new Promise((resolve, reject) => {
      deferredPromise.resolve = resolve;
      deferredPromise.reject = reject;
    }));

    const { container } = renderWithClient(
      <MediaInput
        label="Start Frame"
        role="start"
        onChange={onChange}
        onUpload={mockUpload}
      />
    );

    // Initial state: ReferenceButton with word "Start Frame"
    expect(screen.getByText("Start Frame")).toBeDefined();

    // Drop a valid file
    const file = new File(["dummy image"], "frame1.png", { type: "image/png" });
    const dropTarget = container.firstChild;
    fireEvent.drop(dropTarget, {
      dataTransfer: { files: [file] },
    });

    // Enters uploading state with spinner and temporary preview
    await waitFor(() => {
      expect(screen.getByTestId("media-input-uploading")).toBeDefined();
    });
    expect(mockUpload).toHaveBeenCalledWith(file);
    expect(createObjectURLMock).toHaveBeenCalledWith(file);

    // Resolve upload with canonical media response
    const canonicalItem = {
      id: "media-uuid-123",
      media_id: "media-uuid-123",
      workflowId: "wf-123",
      url: "https://storage.googleapis.com/assets/proj/canonical.png",
      width: 1024,
      height: 1024,
      type: "image",
    };
    deferredPromise.resolve(canonicalItem);

    // Success: commits canonical media, revokes temporary preview, exits uploading
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(canonicalItem);
    });

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/temp-preview");
  });

  it("transitions through uploading -> failed -> retry on upload error, never committing failed item", async () => {
    const onChange = vi.fn();
    let attempt = 0;
    const mockUpload = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) {
        throw new Error("Network timeout during upload");
      }
      return {
        id: "media-retry-ok",
        url: "https://storage.googleapis.com/assets/retry-ok.png",
      };
    });

    const { container } = renderWithClient(
      <MediaInput
        label="End Frame"
        role="end"
        onChange={onChange}
        onUpload={mockUpload}
      />
    );

    const file = new File(["dummy image"], "frame2.jpg", { type: "image/jpeg" });
    const dropTarget = container.firstChild;
    fireEvent.drop(dropTarget, {
      dataTransfer: { files: [file] },
    });

    // Enters uploading then transitions to failed
    await waitFor(() => {
      expect(screen.getByTestId("media-input-failed")).toBeDefined();
    });

    // Failed item NEVER reaches onChange
    expect(onChange).not.toHaveBeenCalled();
    // Temporary preview revoked on failure
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/temp-preview");

    // Click retry button
    const retryBtn = screen.getByTestId("media-input-retry-btn");
    fireEvent.click(retryBtn);

    // Second attempt succeeds and commits
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        id: "media-retry-ok",
        url: "https://storage.googleapis.com/assets/retry-ok.png",
      });
    });
    expect(mockUpload).toHaveBeenCalledTimes(2);
  });

  it("rejects files exceeding policy pre-flight and shows failed state without network call", async () => {
    const onChange = vi.fn();
    const mockUpload = vi.fn();

    const { container } = renderWithClient(
      <MediaInput
        label="Reference"
        role="reference"
        onChange={onChange}
        onUpload={mockUpload}
      />
    );

    // Create an invalid file: text/plain is not allowed in DEFAULT_UPLOAD_POLICY
    const invalidFile = new File(["text content"], "notes.txt", { type: "text/plain" });
    const dropTarget = container.firstChild;
    fireEvent.drop(dropTarget, {
      dataTransfer: { files: [invalidFile] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("media-input-failed")).toBeDefined();
    });

    // Zero network calls made
    expect(mockUpload).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("click fallback triggers file picker or onClick callback", () => {
    const onClick = vi.fn();
    renderWithClient(
      <MediaInput
        label="Start Frame"
        role="start"
        onClick={onClick}
      />
    );

    const button = screen.getByText("Start Frame");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("dismiss button resets failed state back to idle", async () => {
    const { container } = renderWithClient(
      <MediaInput
        label="Start Frame"
        role="start"
        onUpload={vi.fn().mockRejectedValue(new Error("Server error"))}
      />
    );

    const file = new File(["dummy"], "frame.png", { type: "image/png" });
    const dropTarget = container.firstChild;
    fireEvent.drop(dropTarget, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("media-input-failed")).toBeDefined();
    });

    const dismissBtn = screen.getByTestId("media-input-dismiss-btn");
    fireEvent.click(dismissBtn);

    // Returns to idle
    await waitFor(() => {
      expect(screen.getByText("Start Frame")).toBeDefined();
    });
  });
});
