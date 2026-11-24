import { api } from "@/shared/api/client";

// Valid minimal 1x1 RGBA transparent PNG (70 bytes, works in browser & jsdom without canvas).
const SYNTHETIC_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41,
  0x54, 0x78, 0xda, 0x63, 0x64, 0xf8, 0xcf, 0x50,
  0x0f, 0x00, 0x03, 0x86, 0x01, 0x80, 0x5a, 0x34,
  0x7d, 0x6b, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

const RECENT_LOG_LIMIT = 200;
const MAX_CONCURRENCY = 10;
const STAGE_KEYS = [
  "createProject",
  "createFolders",
  "upload",
  "generate",
  "moveMedia",
  "moveFolder",
  "delete",
  "cleanup",
];

export const DEFAULT_LOAD_TEST_CONFIG = {
  uploadCount: 30,
  generateCount: 10,
  folderCount: 10,
  moveMediaCount: 30,
  moveFolderCount: 5,
  durationSeconds: 180,
  concurrency: 3,
  stages: {
    createProject: true,
    createFolders: true,
    upload: true,
    generate: true,
    moveMedia: true,
    moveFolder: true,
    deleteMedia: true,
    cleanupProject: false,
  },
  generateModel: "",
  generateRatio: "1:1",
  isVideoModel: false,
  projectId: "",
  accountLabel: "",
};

function roundMs(value) {
  return Math.round(value * 10) / 10;
}

function nowMs() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function cleanWorkflowId(rawId) {
  return String(rawId || "").trim().replace(/^workflows\//, "");
}

function extractErrorStatus(err) {
  const direct = err?.status ?? err?.statusCode ?? err?.response?.status ?? null;
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  const match = String(err?.message || "").match(/\b([45]\d{2})\b/);
  return match ? Number(match[1]) : 0;
}

function extractProjectId(res) {
  const raw =
    res?.data?.project_id ??
    res?.data?.id ??
    res?.project_id ??
    res?.id ??
    null;
  return raw ? String(raw) : null;
}

function extractWorkflowIdFromResponse(res) {
  const data = res?.data ?? res;
  const item = Array.isArray(data) ? data[0] : (data?.asset ?? data);
  const raw =
    item?.workflow_id ??
    item?.workflowId ??
    item?.workflow?.id ??
    data?.workflow_id ??
    data?.workflowId ??
    data?.workflow?.id ??
    res?.workflow_id ??
    res?.workflowId ??
    res?.workflow?.id ??
    item?.id ??
    item?.asset_id ??
    item?.media_id ??
    null;
  const cleaned = cleanWorkflowId(raw);
  return cleaned || null;
}

function extractFolderIdFromResponse(res) {
  const data = res?.data ?? res;
  const folder = data?.folder ?? data;
  const raw =
    folder?.id ??
    folder?.folder_id ??
    folder?.folderId ??
    folder?._id ??
    data?.id ??
    data?.folder_id ??
    data?.folderId ??
    res?.id ??
    res?.folder_id ??
    res?.folderId ??
    null;
  return raw ? String(raw) : null;
}

async function runBoundedPool({ total, concurrency, durationMs = 0, signal, taskFn }) {
  if (total <= 0 || signal?.aborted) return;
  const phaseStart = nowMs();
  let nextIndex = 0;

  const worker = async () => {
    while (!signal?.aborted) {
      const idx = nextIndex++;
      if (idx >= total) break;

      if (durationMs > 0 && total > 1) {
        const targetOffsetMs = (idx / total) * durationMs;
        const waitMs = targetOffsetMs - (nowMs() - phaseStart);
        if (waitMs > 0) {
          await sleepAbortable(waitMs, signal);
          if (signal?.aborted) break;
        }
      }

      await taskFn(idx);
    }
  };

  const workerCount = Math.min(concurrency, total);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

function assertNotSoftFailure(res, fallbackMessage) {
  if (res && (res.ok === false || res.success === false)) {
    const err = new Error(res.message || res.error || fallbackMessage);
    err.status = res.status || res.statusCode || 400;
    if (res.errorCode || res.code) {
      err.errorCode = res.errorCode || res.code;
    }
    throw err;
  }
}

function sleepAbortable(ms, signal) {
  if (ms <= 0 || signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function interleaveMediaTasks(uploadCount, generateCount) {
  const total = uploadCount + generateCount;
  if (total === 0) return [];
  const tasks = [];
  let uDone = 0;
  let gDone = 0;
  for (let i = 0; i < total; i++) {
    const needUpload = uDone < uploadCount;
    const needGenerate = gDone < generateCount;
    if (needUpload && (!needGenerate || uDone / uploadCount <= gDone / generateCount)) {
      uDone += 1;
      tasks.push({ type: "upload", index: uDone });
    } else {
      gDone += 1;
      tasks.push({ type: "generate", index: gDone });
    }
  }
  return tasks;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const idx = Math.min(sorted.length - 1, Math.max(0, rank));
  return roundMs(sorted[idx]);
}

/**
 * Builds a valid minimal 1x1 PNG File from static bytes without canvas/DOM APIs.
 */
export function createSyntheticPngFile(index = 0) {
  const bytes = new Uint8Array(SYNTHETIC_PNG_BYTES);
  const name = `loadtest-media-${index}.png`;
  if (typeof File === "function") {
    return new File([bytes], name, { type: "image/png" });
  }
  const blob = new Blob([bytes], { type: "image/png" });
  blob.name = name;
  return blob;
}

/**
 * Computes exact request count and latency distribution metrics over log entries.
 */
export function computeLatencyStats(entries = []) {
  const list = Array.isArray(entries) ? entries : [];
  const total = list.length;
  if (total === 0) {
    return {
      total: 0,
      ok: 0,
      failed: 0,
      status409: 0,
      status429: 0,
      status5xx: 0,
      minMs: 0,
      avgMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      maxMs: 0,
    };
  }

  let ok = 0;
  let status409 = 0;
  let status429 = 0;
  let status5xx = 0;
  let sum = 0;
  const latencies = new Array(total);

  for (let i = 0; i < total; i++) {
    const entry = list[i];
    const ms = Number.isFinite(entry?.latencyMs) ? Math.max(0, entry.latencyMs) : 0;
    latencies[i] = ms;
    sum += ms;

    if (entry?.ok) {
      ok += 1;
    } else {
      const code = Number(entry?.status) || 0;
      if (code === 409) status409 += 1;
      else if (code === 429) status429 += 1;
      else if (code >= 500 && code < 600) status5xx += 1;
    }
  }

  latencies.sort((a, b) => a - b);

  return {
    total,
    ok,
    failed: total - ok,
    status409,
    status429,
    status5xx,
    minMs: roundMs(latencies[0]),
    avgMs: roundMs(sum / total),
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    maxMs: roundMs(latencies[total - 1]),
  };
}

async function parseJsonOrTextResponse(response, fallbackMessage) {
  const text = await response.text().catch(() => "");
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (!response.ok) {
    const errMsg =
      (parsed && typeof parsed === "object" && (parsed.message || (typeof parsed.error === "string" ? parsed.error : null))) ||
      fallbackMessage ||
      `API error: ${response.status} ${response.statusText}`;
    const err = new Error(errMsg);
    err.status = response.status;
    if (parsed && typeof parsed === "object" && (parsed.errorCode ?? parsed.code)) {
      err.errorCode = parsed.errorCode ?? parsed.code;
    }
    throw err;
  }
  return parsed;
}

function buildTimedSignal(externalSignal, timeoutMs = 30000) {
  if (!timeoutMs || timeoutMs <= 0) {
    return { signal: externalSignal, cleanup: () => {} };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    },
  };
}

/**
 * Creates a dev-only API client scoped to one captured Google account session
 * via the Next.js dev proxy (`/api/dev-load-test/proxy/...`).
 */
export function createAccountApiClient(accountId) {
  const send = async (method, endpoint, body, options = {}) => {
    const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const headers = {
      ...(options.headers || {}),
      "x-load-test-account-id": String(accountId),
    };
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const { signal, cleanup } = buildTimedSignal(options.signal, options.timeout ?? 30000);
    try {
      const response = await fetch(`/api/dev-load-test/proxy${normalized}`, {
        method,
        headers,
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
        signal,
        cache: "no-store",
      });
      if (response.status === 204 || response.status === 205) return null;
      return await parseJsonOrTextResponse(response, `API error: ${response.status}`);
    } finally {
      cleanup();
    }
  };

  return {
    get: (endpoint, options) => send("GET", endpoint, undefined, options),
    post: (endpoint, body, options) => send("POST", endpoint, body, options),
    postForm: (endpoint, formData, options) => send("POST", endpoint, formData, options),
    patch: (endpoint, body, options) => send("PATCH", endpoint, body, options),
    delete: (endpoint, options) => send("DELETE", endpoint, undefined, options),
  };
}

export async function fetchConnectedLoadTestAccounts() {
  const res = await fetch("/api/dev-load-test/accounts", { method: "GET", cache: "no-store" });
  const data = await parseJsonOrTextResponse(res, "Failed to load connected Google accounts");
  return Array.isArray(data?.accounts) ? data.accounts : [];
}

export async function captureCurrentGoogleAccount() {
  const res = await fetch("/api/dev-load-test/accounts", { method: "POST", cache: "no-store" });
  return parseJsonOrTextResponse(res, "Failed to capture current Google session");
}

export async function removeConnectedLoadTestAccount(accountId) {
  const res = await fetch(`/api/dev-load-test/accounts?id=${encodeURIComponent(accountId)}`, {
    method: "DELETE",
    cache: "no-store",
  });
  const data = await parseJsonOrTextResponse(res, "Failed to remove account");
  return Array.isArray(data?.accounts) ? data.accounts : [];
}

export async function clearConnectedLoadTestAccounts() {
  const res = await fetch("/api/dev-load-test/accounts?all=1", {
    method: "DELETE",
    cache: "no-store",
  });
  const data = await parseJsonOrTextResponse(res, "Failed to clear accounts");
  return Array.isArray(data?.accounts) ? data.accounts : [];
}

export async function deleteLoadTestProject(projectId, { signal, accountId, apiClient } = {}) {
  if (!projectId) throw new Error("Project ID is required");
  const client = apiClient || (accountId ? createAccountApiClient(accountId) : api);
  const res = await client.delete(`/projects/${projectId}`, { signal, timeout: 30000 });
  assertNotSoftFailure(res, "Failed to delete project");
  return res;
}

export function buildExportReport(snapshot, meta = {}) {
  return {
    exportedAt: new Date().toISOString(),
    apiBaseUrl: meta.apiBaseUrl || null,
    accounts: meta.accounts || snapshot?.accounts || null,
    summary: snapshot,
  };
}

/**
 * Executes a paced or burst load test against the real backend API via `@/shared/api/client`
 * or an account-scoped dev proxy client when `accountId` / `apiClient` is provided.
 */
export async function runLoadTest(rawConfig = {}, { onUpdate, onEntry, signal, apiClient } = {}) {
  const client = apiClient || (rawConfig.accountId ? createAccountApiClient(rawConfig.accountId) : api);
  const stagesConfig = {
    ...DEFAULT_LOAD_TEST_CONFIG.stages,
    ...(rawConfig.stages || {}),
  };

  const config = {
    ...DEFAULT_LOAD_TEST_CONFIG,
    ...rawConfig,
    uploadCount: Math.max(0, Math.floor(Number(rawConfig.uploadCount ?? DEFAULT_LOAD_TEST_CONFIG.uploadCount) || 0)),
    generateCount: Math.max(0, Math.floor(Number(rawConfig.generateCount ?? DEFAULT_LOAD_TEST_CONFIG.generateCount) || 0)),
    folderCount: Math.max(0, Math.floor(Number(rawConfig.folderCount ?? DEFAULT_LOAD_TEST_CONFIG.folderCount) || 0)),
    moveMediaCount: Math.max(0, Math.floor(Number(rawConfig.moveMediaCount ?? DEFAULT_LOAD_TEST_CONFIG.moveMediaCount) || 0)),
    moveFolderCount: Math.max(0, Math.floor(Number(rawConfig.moveFolderCount ?? DEFAULT_LOAD_TEST_CONFIG.moveFolderCount) || 0)),
    durationSeconds: Math.max(0, Number(rawConfig.durationSeconds ?? DEFAULT_LOAD_TEST_CONFIG.durationSeconds) || 0),
    concurrency: Math.min(MAX_CONCURRENCY, Math.max(1, Math.floor(Number(rawConfig.concurrency ?? DEFAULT_LOAD_TEST_CONFIG.concurrency) || 1))),
    stages: stagesConfig,
  };

  const allEntries = [];
  const stageEntries = {
    createProject: [],
    createFolders: [],
    upload: [],
    generate: [],
    moveMedia: [],
    moveFolder: [],
    delete: [],
    cleanup: [],
  };
  const createdWorkflowIds = [];
  const seenWorkflowIds = new Set();
  const createdFolderIds = [];
  const seenFolderIds = new Set();

  let activeProjectId = config.projectId ? String(config.projectId).trim() : null;
  let status = "running";
  let currentStage = "init";
  let entrySeq = 0;

  const startedAtPerf = nowMs();
  const startedAtIso = new Date().toISOString();
  let finishedAtIso = null;

  const plannedFolders = config.stages.createFolders ? config.folderCount : 0;
  const mediaUploadCount = config.stages.upload ? config.uploadCount : 0;
  const mediaGenerateCount = config.stages.generate ? config.generateCount : 0;
  const mediaTotalCount = mediaUploadCount + mediaGenerateCount;
  let moveMediaPlanned =
    config.stages.moveMedia && plannedFolders > 0 && mediaTotalCount > 0 ? config.moveMediaCount : 0;
  let moveFolderPlanned =
    config.stages.moveFolder && plannedFolders >= 2 ? config.moveFolderCount : 0;
  let deletePlanned = config.stages.deleteMedia ? mediaTotalCount : 0;

  const totalPacedOps = plannedFolders + mediaTotalCount + moveMediaPlanned + moveFolderPlanned;
  const phaseDurationMs = (ops) =>
    config.durationSeconds > 0 && totalPacedOps > 0 && ops > 0
      ? (config.durationSeconds * 1000 * ops) / totalPacedOps
      : 0;

  const getPlannedOps = () =>
    (config.stages.createProject ? 1 : 0) +
    plannedFolders +
    mediaTotalCount +
    moveMediaPlanned +
    moveFolderPlanned +
    deletePlanned +
    (config.stages.cleanupProject ? 1 : 0);

  const buildSnapshot = () => {
    const elapsedMs = Math.max(0, Math.round(nowMs() - startedAtPerf));
    const throughputPerMin =
      elapsedMs > 0 && allEntries.length > 0
        ? Math.round((allEntries.length / (elapsedMs / 60000)) * 10) / 10
        : 0;

    const stages = {};
    for (const key of STAGE_KEYS) {
      stages[key] = computeLatencyStats(stageEntries[key]);
    }

    return {
      status,
      currentStage,
      accountId: config.accountId || null,
      accountLabel: config.accountLabel || "",
      projectId: activeProjectId,
      createdWorkflowIds: [...createdWorkflowIds],
      createdFolderIds: [...createdFolderIds],
      elapsedMs,
      completedOps: allEntries.length,
      plannedOps: getPlannedOps(),
      throughputPerMin,
      overall: computeLatencyStats(allEntries),
      stages,
      recentLog: allEntries.slice(-RECENT_LOG_LIMIT).reverse(),
      totalLogged: allEntries.length,
      config,
      startedAtIso,
      finishedAtIso,
    };
  };

  const emit = () => {
    if (typeof onUpdate === "function") {
      onUpdate(buildSnapshot());
    }
  };

  const recordCall = async ({ stage, method, endpoint, fn }) => {
    if (signal?.aborted) return { aborted: true };
    const t0 = nowMs();
    try {
      const res = await fn();
      assertNotSoftFailure(res, `API failure on ${endpoint}`);
      const latencyMs = roundMs(nowMs() - t0);
      const entry = {
        id: ++entrySeq,
        timestamp: new Date().toISOString(),
        accountId: config.accountId || null,
        accountLabel: config.accountLabel || "",
        stage,
        method,
        endpoint,
        ok: true,
        status: 200,
        errorCode: null,
        message: "OK",
        latencyMs,
      };
      allEntries.push(entry);
      stageEntries[stage].push(entry);
      if (typeof onEntry === "function") onEntry(entry);
      emit();
      return { ok: true, data: res };
    } catch (err) {
      // apiRequest converts AbortError into a generic timeout Error, so check signal first.
      if (signal?.aborted) return { aborted: true };
      const latencyMs = roundMs(nowMs() - t0);
      const entry = {
        id: ++entrySeq,
        timestamp: new Date().toISOString(),
        accountId: config.accountId || null,
        accountLabel: config.accountLabel || "",
        stage,
        method,
        endpoint,
        ok: false,
        status: extractErrorStatus(err),
        errorCode: err?.errorCode ?? err?.code ?? null,
        message: err?.message || "Request failed",
        latencyMs,
      };
      allEntries.push(entry);
      stageEntries[stage].push(entry);
      if (typeof onEntry === "function") onEntry(entry);
      emit();
      return { ok: false, error: err };
    }
  };

  const addWorkflowId = (wfId) => {
    if (!wfId || seenWorkflowIds.has(wfId)) return;
    seenWorkflowIds.add(wfId);
    createdWorkflowIds.push(wfId);
  };

  const addFolderId = (folderId) => {
    if (!folderId || seenFolderIds.has(folderId)) return;
    seenFolderIds.add(folderId);
    createdFolderIds.push(folderId);
  };

  emit();

  // Stage 1: Create temporary project
  if (config.stages.createProject && !signal?.aborted) {
    currentStage = "createProject";
    const labelSuffix = config.accountLabel ? ` ${config.accountLabel}` : "";
    const stamp = new Date().toISOString().slice(11, 19);
    const projectName = `[LoadTest]${labelSuffix} ${stamp}`;

    const res = await recordCall({
      stage: "createProject",
      method: "POST",
      endpoint: "/projects",
      fn: () => client.post("/projects", { project_name: projectName, name: projectName }, { signal, timeout: 30000 }),
    });

    if (res.ok) {
      const newId = extractProjectId(res.data);
      if (newId) activeProjectId = newId;
    }
  }

  const hasProjectWork = plannedFolders > 0 || mediaTotalCount > 0;
  if (!signal?.aborted && hasProjectWork && !activeProjectId) {
    status = "failed";
    currentStage = "done";
    finishedAtIso = new Date().toISOString();
    const finalSnapshot = buildSnapshot();
    emit();
    return finalSnapshot;
  }

  // Stage 2: Create folders batch
  if (!signal?.aborted && plannedFolders > 0) {
    currentStage = "createFolders";
    const folderEndpoint = `/projects/${activeProjectId}/folders`;

    await runBoundedPool({
      total: plannedFolders,
      concurrency: config.concurrency,
      durationMs: phaseDurationMs(plannedFolders),
      signal,
      taskFn: async (idx) => {
        const res = await recordCall({
          stage: "createFolders",
          method: "POST",
          endpoint: folderEndpoint,
          fn: () =>
            client.post(
              folderEndpoint,
              { name: `[LT] Folder ${idx + 1}`, parentId: null },
              { signal, timeout: 30000 }
            ),
        });
        if (res.ok) addFolderId(extractFolderIdFromResponse(res.data));
      },
    });
  }

  // Stage 3: Interleaved Upload + Generate workload with bounded concurrency and pacing
  if (!signal?.aborted && mediaTotalCount > 0) {
    currentStage = "media";
    const tasks = interleaveMediaTasks(mediaUploadCount, mediaGenerateCount);
    const modelId = String(config.generateModel || "").trim();
    const isVideo =
      Boolean(config.isVideoModel) || /^(ltx|seedance|wan)/i.test(modelId);
    const generateEndpoint = isVideo ? "/video/generated" : "/images/generated";

    await runBoundedPool({
      total: tasks.length,
      concurrency: config.concurrency,
      durationMs: phaseDurationMs(tasks.length),
      signal,
      taskFn: async (idx) => {
        const task = tasks[idx];
        if (task.type === "upload") {
          const formData = new FormData();
          formData.append("project_id", activeProjectId);
          formData.append("workflow_type", "UPLOAD");
          formData.append("workflowType", "UPLOAD");
          formData.append("type", "upload");
          formData.append("source", "upload");
          formData.append("width", "1");
          formData.append("height", "1");
          formData.append("ratio", "1:1");
          formData.append("file", createSyntheticPngFile(task.index));

          const res = await recordCall({
            stage: "upload",
            method: "POST",
            endpoint: "/assets/upload",
            fn: () => client.postForm("/assets/upload", formData, { signal, timeout: 60000 }),
          });
          if (res.ok) addWorkflowId(extractWorkflowIdFromResponse(res.data));
        } else {
          const payload = {
            model: modelId,
            prompt: `Load test scene #${task.index} — minimal dark studio still`,
            project_id: activeProjectId,
            parameters: { aspect_ratio: config.generateRatio || "1:1" },
            references: [],
            elements: [],
            characters: [],
          };

          const res = await recordCall({
            stage: "generate",
            method: "POST",
            endpoint: generateEndpoint,
            fn: () => client.post(generateEndpoint, payload, { signal, timeout: 30000 }),
          });
          if (res.ok) addWorkflowId(extractWorkflowIdFromResponse(res.data));
        }
      },
    });
  }

  // Stage 4: Move created media workflows into created folders
  if (config.stages.moveMedia && config.moveMediaCount > 0) {
    if (createdWorkflowIds.length === 0 || createdFolderIds.length === 0) {
      moveMediaPlanned = 0;
    } else if (!signal?.aborted) {
      moveMediaPlanned = config.moveMediaCount;
      currentStage = "moveMedia";

      await runBoundedPool({
        total: moveMediaPlanned,
        concurrency: config.concurrency,
        durationMs: phaseDurationMs(moveMediaPlanned),
        signal,
        taskFn: async (idx) => {
          const wfId = createdWorkflowIds[idx % createdWorkflowIds.length];
          const pass = Math.floor(idx / createdWorkflowIds.length);
          const targetFolderId = createdFolderIds[(idx + pass) % createdFolderIds.length];
          const endpoint = `/assets/${wfId}/folder`;
          await recordCall({
            stage: "moveMedia",
            method: "PATCH",
            endpoint,
            fn: () => client.patch(endpoint, { folderId: targetFolderId }, { signal, timeout: 30000 }),
          });
        },
      });
    }
  }

  // Stage 5: Move child folders into root folders (disjoint partition guarantees zero cycles)
  if (config.stages.moveFolder && config.moveFolderCount > 0) {
    if (createdFolderIds.length < 2) {
      moveFolderPlanned = 0;
    } else if (!signal?.aborted) {
      moveFolderPlanned = config.moveFolderCount;
      currentStage = "moveFolder";
      const rootCount = Math.max(1, Math.floor(createdFolderIds.length / 2));
      const parentTargets = createdFolderIds.slice(0, rootCount);
      const childFolders = createdFolderIds.slice(rootCount);

      await runBoundedPool({
        total: moveFolderPlanned,
        concurrency: config.concurrency,
        durationMs: phaseDurationMs(moveFolderPlanned),
        signal,
        taskFn: async (idx) => {
          const childId = childFolders[idx % childFolders.length];
          const pass = Math.floor(idx / childFolders.length);
          const parentId = parentTargets[(idx + pass) % parentTargets.length];
          const endpoint = `/folders/${childId}`;
          await recordCall({
            stage: "moveFolder",
            method: "PATCH",
            endpoint,
            fn: () => client.patch(endpoint, { parentId }, { signal, timeout: 30000 }),
          });
        },
      });
    }
  }

  // Stage 6: Delete created media workflows
  if (config.stages.deleteMedia) {
    deletePlanned = createdWorkflowIds.length;
    if (!signal?.aborted && createdWorkflowIds.length > 0) {
      currentStage = "delete";

      await runBoundedPool({
        total: createdWorkflowIds.length,
        concurrency: config.concurrency,
        signal,
        taskFn: async (idx) => {
          const wfId = createdWorkflowIds[idx];
          const endpoint = `/workflows/workflows/${wfId}`;
          await recordCall({
            stage: "delete",
            method: "DELETE",
            endpoint,
            fn: () => client.delete(endpoint, { signal, timeout: 30000 }),
          });
        },
      });
    }
  }

  // Stage 7: Optional project cleanup
  if (!signal?.aborted && config.stages.cleanupProject && activeProjectId) {
    currentStage = "cleanup";
    const endpoint = `/projects/${activeProjectId}`;
    await recordCall({
      stage: "cleanup",
      method: "DELETE",
      endpoint,
      fn: () => client.delete(endpoint, { signal, timeout: 30000 }),
    });
  }

  status = signal?.aborted ? "aborted" : "completed";
  currentStage = "done";
  finishedAtIso = new Date().toISOString();
  const finalSnapshot = buildSnapshot();
  emit();
  return finalSnapshot;
}

/**
 * Runs the configured load test across multiple connected Google accounts simultaneously
 * and aggregates exact combined + per-stage + per-account telemetry.
 */
export async function runMultiAccountLoadTest(
  accounts = [],
  rawConfig = {},
  { onUpdate, signal, createApiClient } = {}
) {
  const validAccounts = (Array.isArray(accounts) ? accounts : []).filter((a) => a && a.id);
  if (validAccounts.length === 0) {
    throw new Error("Connect at least one Google account to start the test.");
  }

  const allEntries = [];
  const stageEntries = {
    createProject: [],
    createFolders: [],
    upload: [],
    generate: [],
    moveMedia: [],
    moveFolder: [],
    delete: [],
    cleanup: [],
  };
  const perAccountSnapshots = new Map();
  let globalSeq = 0;

  const startedAtPerf = nowMs();
  const startedAtIso = new Date().toISOString();
  let finishedAtIso = null;
  let globalStatus = "running";

  const buildCombinedSnapshot = () => {
    const elapsedMs = Math.max(0, Math.round(nowMs() - startedAtPerf));
    const throughputPerMin =
      elapsedMs > 0 && allEntries.length > 0
        ? Math.round((allEntries.length / (elapsedMs / 60000)) * 10) / 10
        : 0;

    const stages = {};
    for (const key of STAGE_KEYS) {
      stages[key] = computeLatencyStats(stageEntries[key]);
    }

    let plannedOps = 0;
    const createdWorkflowIds = [];
    const createdFolderIds = [];
    const createdProjects = [];
    const activeStages = new Set();

    const accountSummaries = validAccounts.map((acc) => {
      const snap = perAccountSnapshots.get(acc.id);
      if (snap) {
        plannedOps += snap.plannedOps || 0;
        createdWorkflowIds.push(...(snap.createdWorkflowIds || []));
        createdFolderIds.push(...(snap.createdFolderIds || []));
        if (snap.projectId) {
          createdProjects.push({
            accountId: acc.id,
            accountLabel: acc.email || acc.name || acc.id,
            projectId: snap.projectId,
          });
        }
        if (snap.status === "running" && snap.currentStage) {
          activeStages.add(snap.currentStage);
        }
      }

      return {
        id: acc.id,
        email: acc.email || acc.id,
        name: acc.name || null,
        status: snap?.status || "running",
        currentStage: snap?.currentStage || "init",
        projectId: snap?.projectId || null,
        completedOps: snap?.completedOps ?? 0,
        plannedOps: snap?.plannedOps ?? 0,
        createdWorkflowCount: snap?.createdWorkflowIds?.length ?? 0,
        createdFolderCount: snap?.createdFolderIds?.length ?? 0,
        overall: snap?.overall || computeLatencyStats([]),
      };
    });

    const currentStage =
      globalStatus !== "running"
        ? "done"
        : activeStages.size > 0
          ? Array.from(activeStages).join(", ")
          : "running";

    return {
      status: globalStatus,
      currentStage,
      accountCount: validAccounts.length,
      accounts: accountSummaries,
      projectId: createdProjects[0]?.projectId || null,
      createdProjects,
      createdWorkflowIds,
      createdFolderIds,
      elapsedMs,
      completedOps: allEntries.length,
      plannedOps,
      throughputPerMin,
      overall: computeLatencyStats(allEntries),
      stages,
      recentLog: allEntries.slice(-RECENT_LOG_LIMIT).reverse(),
      totalLogged: allEntries.length,
      config: rawConfig,
      startedAtIso,
      finishedAtIso,
    };
  };

  const emitCombined = () => {
    if (typeof onUpdate === "function") {
      onUpdate(buildCombinedSnapshot());
    }
  };

  emitCombined();

  await Promise.all(
    validAccounts.map((acc) => {
      const label = acc.email || acc.name || acc.id;
      const client =
        typeof createApiClient === "function"
          ? createApiClient(acc)
          : createAccountApiClient(acc.id);

      return runLoadTest(
        {
          ...rawConfig,
          accountId: acc.id,
          accountLabel: label,
          // Multi-account mode creates one isolated project per account when createProject is enabled
          projectId: validAccounts.length > 1 && rawConfig?.stages?.createProject !== false ? "" : rawConfig.projectId || "",
        },
        {
          signal,
          apiClient: client,
          onEntry: (entry) => {
            const tagged = { ...entry, id: ++globalSeq, accountId: acc.id, accountLabel: label };
            allEntries.push(tagged);
            if (stageEntries[entry.stage]) {
              stageEntries[entry.stage].push(tagged);
            }
          },
          onUpdate: (accSnap) => {
            perAccountSnapshots.set(acc.id, accSnap);
            emitCombined();
          },
        }
      );
    })
  );

  const anyFailed = Array.from(perAccountSnapshots.values()).some((s) => s.status === "failed");
  globalStatus = signal?.aborted ? "aborted" : anyFailed ? "failed" : "completed";
  finishedAtIso = new Date().toISOString();
  const finalSnapshot = buildCombinedSnapshot();
  emitCombined();
  return finalSnapshot;
}
