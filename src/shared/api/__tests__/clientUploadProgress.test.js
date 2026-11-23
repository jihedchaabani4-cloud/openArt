import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("api.postForm two-stage upload progress (uploading -> processing -> done)", () => {
  let lastXhr = null;
  const originalXhr = globalThis.XMLHttpRequest;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";

    class MockXMLHttpRequest {
      constructor() {
        this.upload = {};
        this.status = 0;
        this.statusText = "";
        this.responseText = "";
        this.headers = {};
        lastXhr = this;
      }
      open(method, url) {
        this.method = method;
        this.url = url;
      }
      setRequestHeader(k, v) {
        this.headers[k] = v;
      }
      getResponseHeader() {
        return "application/json";
      }
      send() {}
      abort() {
        this.onabort?.();
      }
    }

    globalThis.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    globalThis.XMLHttpRequest = originalXhr;
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    lastXhr = null;
  });

  it("switches straight to processing phase when frontend finishes sending all bytes while awaiting backend return", async () => {
    const { api } = await import("../client");
    const events = [];

    const promise = api.postForm("/assets/upload", new FormData(), {
      onUploadProgress: (percent, meta) => events.push({ percent, phase: meta.phase }),
    });

    // Browser flushes all bytes immediately to backend -> switches to processing
    lastXhr.upload.onprogress({ lengthComputable: true, loaded: 2_000_000, total: 2_000_000 });
    lastXhr.upload.onload();

    expect(events).toEqual([{ percent: 100, phase: "processing" }]);

    // Backend responds 200 OK
    lastXhr.status = 200;
    lastXhr.responseText = JSON.stringify({ ok: true, id: "asset-1" });
    lastXhr.onload();

    const res = await promise;
    expect(res).toEqual({ ok: true, id: "asset-1" });
    expect(events).toEqual([
      { percent: 100, phase: "processing" },
      { percent: 100, phase: "done" },
    ]);
  });

  it("reports real 0..99% byte transfer chunks during uploading, then processing when transfer finishes, then done on 200", async () => {
    const { api } = await import("../client");
    const events = [];

    const promise = api.postForm("/assets/upload", new FormData(), {
      onUploadProgress: (percent, meta) => events.push({ percent, phase: meta.phase }),
    });

    lastXhr.upload.onprogress({ lengthComputable: true, loaded: 250, total: 1000 });
    lastXhr.upload.onprogress({ lengthComputable: true, loaded: 600, total: 1000 });
    lastXhr.upload.onprogress({ lengthComputable: true, loaded: 1000, total: 1000 });

    expect(events).toEqual([
      { percent: 25, phase: "uploading" },
      { percent: 60, phase: "uploading" },
      { percent: 100, phase: "processing" },
    ]);

    lastXhr.status = 200;
    lastXhr.responseText = JSON.stringify({ ok: true });
    lastXhr.onload();

    await promise;
    expect(events[events.length - 1]).toEqual({ percent: 100, phase: "done" });
  });
});
