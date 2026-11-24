"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notFound } from "next/navigation";
import { useAuthSession } from "@/shared/api/auth";
import { useRealBackendModels } from "@/features/prompt-bar/adapters/useRealBackendModels";
import {
  buildExportReport,
  captureCurrentGoogleAccount,
  clearConnectedLoadTestAccounts,
  DEFAULT_LOAD_TEST_CONFIG,
  deleteLoadTestProject,
  fetchConnectedLoadTestAccounts,
  removeConnectedLoadTestAccount,
  runMultiAccountLoadTest,
} from "@/features/load-test/loadTestRunner";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { Input } from "@/components/base/input";
import { Switch } from "@/components/base/switch";
import { Badge } from "@/components/base/badge";
import { SectionCard } from "@/components/base/section-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/base/select";

const PRESETS = [
  {
    id: "30-3m",
    label: "30 Media + 10 Folders / 3 min",
    uploadCount: 20,
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
  },
  {
    id: "50-3m",
    label: "50 Media + 15 Folders / 3 min",
    uploadCount: 35,
    generateCount: 15,
    folderCount: 15,
    moveMediaCount: 50,
    moveFolderCount: 8,
    durationSeconds: 180,
    concurrency: 4,
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
  },
  {
    id: "heavy-3m-0cr",
    label: "Heavy: 80 Upload + 25 Folders + 120 Moves / 3 min (0 credits)",
    uploadCount: 80,
    generateCount: 0,
    folderCount: 25,
    moveMediaCount: 100,
    moveFolderCount: 20,
    durationSeconds: 180,
    concurrency: 5,
    stages: {
      createProject: true,
      createFolders: true,
      upload: true,
      generate: false,
      moveMedia: true,
      moveFolder: true,
      deleteMedia: true,
      cleanupProject: false,
    },
  },
  {
    id: "burst-0cr",
    label: "Burst: 50 Upload + 20 Folders + 85 Moves (0 credits)",
    uploadCount: 50,
    generateCount: 0,
    folderCount: 20,
    moveMediaCount: 70,
    moveFolderCount: 15,
    durationSeconds: 0,
    concurrency: 6,
    stages: {
      createProject: true,
      createFolders: true,
      upload: true,
      generate: false,
      moveMedia: true,
      moveFolder: true,
      deleteMedia: true,
      cleanupProject: false,
    },
  },
  {
    id: "massive-burst-0cr",
    label: "Massive Burst: 120 Upload + 30 Folders + 175 Moves (0 credits)",
    uploadCount: 120,
    generateCount: 0,
    folderCount: 30,
    moveMediaCount: 150,
    moveFolderCount: 25,
    durationSeconds: 0,
    concurrency: 8,
    stages: {
      createProject: true,
      createFolders: true,
      upload: true,
      generate: false,
      moveMedia: true,
      moveFolder: true,
      deleteMedia: true,
      cleanupProject: false,
    },
  },
];

const RATIO_OPTIONS = ["1:1", "16:9", "9:16", "4:3"];
const STAGE_LABELS = [
  ["createProject", "Create Project"],
  ["createFolders", "Create Folders"],
  ["upload", "Upload Media"],
  ["generate", "Generate Media"],
  ["moveMedia", "Move Media → Folder"],
  ["moveFolder", "Move Folder → Folder"],
  ["delete", "Delete Media"],
  ["cleanup", "Cleanup Project"],
];

function formatElapsed(ms) {
  const totalSec = Math.floor((ms || 0) / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatShortAccount(label) {
  const str = String(label || "");
  if (!str) return "";
  const atIdx = str.indexOf("@");
  return atIdx > 0 ? str.slice(0, atIdx) : str;
}

function getStatusBadgeVariant(status) {
  if (status === "completed") return "success";
  if (status === "running") return "warning";
  if (status === "failed" || status === "aborted") return "danger";
  return "default";
}

function getHttpBadgeVariant(entry) {
  if (entry.ok) return "success";
  if (entry.status === 409 || entry.status === 429) return "warning";
  return "danger";
}

export default function LoadTestPage() {
  const { data: currentBrowserUser, refetch: refetchAuth } = useAuthSession();
  const { data: modelsData, isLoading: modelsLoading } = useRealBackendModels();

  const models = useMemo(() => {
    const list = modelsData?.models || [];
    return [...list].sort((a, b) => {
      if (a.domain === b.domain) return String(a.name || a.id).localeCompare(String(b.name || b.id));
      return a.domain === "image" ? -1 : 1;
    });
  }, [modelsData]);

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState({});
  const [accountBusy, setAccountBusy] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState("");

  const [uploadCount, setUploadCount] = useState(DEFAULT_LOAD_TEST_CONFIG.uploadCount);
  const [generateCount, setGenerateCount] = useState(DEFAULT_LOAD_TEST_CONFIG.generateCount);
  const [folderCount, setFolderCount] = useState(DEFAULT_LOAD_TEST_CONFIG.folderCount);
  const [moveMediaCount, setMoveMediaCount] = useState(DEFAULT_LOAD_TEST_CONFIG.moveMediaCount);
  const [moveFolderCount, setMoveFolderCount] = useState(DEFAULT_LOAD_TEST_CONFIG.moveFolderCount);
  const [durationSeconds, setDurationSeconds] = useState(DEFAULT_LOAD_TEST_CONFIG.durationSeconds);
  const [concurrency, setConcurrency] = useState(DEFAULT_LOAD_TEST_CONFIG.concurrency);
  const [selectedModel, setSelectedModel] = useState("");
  const [generateRatio, setGenerateRatio] = useState(DEFAULT_LOAD_TEST_CONFIG.generateRatio);
  const [manualProjectId, setManualProjectId] = useState("");
  const [createProjectStage, setCreateProjectStage] = useState(true);
  const [createFoldersStage, setCreateFoldersStage] = useState(true);
  const [moveMediaStage, setMoveMediaStage] = useState(true);
  const [moveFolderStage, setMoveFolderStage] = useState(true);
  const [deleteMediaStage, setDeleteMediaStage] = useState(true);
  const [cleanupProjectStage, setCleanupProjectStage] = useState(false);

  const [snapshot, setSnapshot] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cleanupBusyId, setCleanupBusyId] = useState("");
  const [cleanedProjects, setCleanedProjects] = useState({});
  const [actionMessage, setActionMessage] = useState("");
  const abortControllerRef = useRef(null);
  const popupTimerRef = useRef(null);
  const awaitingPopupRef = useRef(false);

  const syncAccountsList = useCallback((list) => {
    const safeList = Array.isArray(list) ? list : [];
    setAccounts(safeList);
    setSelectedAccountIds((prev) => {
      const next = {};
      for (const acc of safeList) {
        next[acc.id] = prev[acc.id] !== undefined ? prev[acc.id] : true;
      }
      return next;
    });
  }, []);

  const refreshPool = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const list = await fetchConnectedLoadTestAccounts();
        syncAccountsList(list);
        if (!silent) {
          setAccountFeedback(`Loaded ${list.length} connected Google account(s).`);
        }
        return list;
      } catch (err) {
        if (!silent) {
          setAccountFeedback(err?.message || "Failed to refresh account pool.");
        }
        return [];
      }
    },
    [syncAccountsList]
  );

  const captureSession = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setAccountBusy(true);
      try {
        const data = await captureCurrentGoogleAccount();
        const prevIds = new Set(accounts.map((a) => a.id));
        const nextList = Array.isArray(data?.accounts) ? data.accounts : [];
        syncAccountsList(nextList);
        if (data?.account?.id) {
          setSelectedAccountIds((prev) => ({ ...prev, [data.account.id]: true }));
        }
        if (!silent && data?.account) {
          const alreadyExisted = prevIds.has(data.account.id);
          setAccountFeedback(
            alreadyExisted
              ? `Updated session for ${data.account.email}. To add a different Google account, pick another account in Google or open this page in Incognito / another browser profile.`
              : `Connected Google account: ${data.account.email} (${nextList.length} total in pool).`
          );
        }
        refetchAuth();
        return data;
      } catch (err) {
        if (!silent) {
          setAccountFeedback(err?.message || "No active Google session found.");
        }
        return null;
      } finally {
        if (!silent) setAccountBusy(false);
      }
    },
    [accounts, refetchAuth, syncAccountsList]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      // Auto-capture current localhost Google session if present, then list full server pool
      await captureCurrentGoogleAccount().catch(() => null);
      if (!active) return;
      const list = await fetchConnectedLoadTestAccounts().catch(() => []);
      if (active) syncAccountsList(list);
    })();
    return () => {
      active = false;
    };
  }, [syncAccountsList]);

  useEffect(() => {
    const onWindowFocus = () => {
      if (awaitingPopupRef.current) {
        awaitingPopupRef.current = false;
        setOauthPending(false);
        captureSession({ silent: false });
      } else {
        refreshPool({ silent: true });
      }
    };
    window.addEventListener("focus", onWindowFocus);
    return () => window.removeEventListener("focus", onWindowFocus);
  }, [captureSession, refreshPool]);

  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
      }
    };
  }, []);

  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "Not configured";
  const activeModelObj = models.find((m) => m.id === selectedModel);
  const selectedAccounts = useMemo(
    () => accounts.filter((a) => selectedAccountIds[a.id] !== false),
    [accounts, selectedAccountIds]
  );
  const overall = snapshot?.overall;
  const successRate =
    overall && overall.total > 0
      ? `${Math.round((overall.ok / overall.total) * 1000) / 10}%`
      : "—";
  const progressPct =
    snapshot && snapshot.plannedOps > 0
      ? Math.min(100, Math.round((snapshot.completedOps / snapshot.plannedOps) * 100))
      : 0;
  const uncleanedProjects = useMemo(
    () => (snapshot?.createdProjects || []).filter((p) => p.projectId && !cleanedProjects[p.projectId]),
    [snapshot, cleanedProjects]
  );

  const handleConnectGooglePopup = () => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setAccountFeedback("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }

    if (popupTimerRef.current) {
      clearInterval(popupTimerRef.current);
      popupTimerRef.current = null;
    }

    const oauthUrl = `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/auth/google`;
    const popup = window.open(
      oauthUrl,
      "loadtest-google-oauth",
      "width=520,height=680,menubar=no,toolbar=no,status=no"
    );

    if (!popup) {
      setAccountFeedback("Popup was blocked by browser. Allow popups for localhost and try again.");
      return;
    }

    awaitingPopupRef.current = true;
    setOauthPending(true);
    setAccountFeedback("Waiting for Google sign-in in popup…");

    let sawCrossOrigin = false;
    popupTimerRef.current = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(popupTimerRef.current);
          popupTimerRef.current = null;
          // Note: COOP may report closed early; window focus handler also re-captures on return
          if (sawCrossOrigin) {
            awaitingPopupRef.current = false;
            setOauthPending(false);
            captureSession({ silent: false });
          }
          return;
        }
        const sameOrigin = popup.location.origin === window.location.origin;
        const isRealPage = popup.location.href && popup.location.href !== "about:blank";
        if (sawCrossOrigin && sameOrigin && isRealPage) {
          clearInterval(popupTimerRef.current);
          popupTimerRef.current = null;
          awaitingPopupRef.current = false;
          setOauthPending(false);
          popup.close();
          captureSession({ silent: false });
        }
      } catch {
        sawCrossOrigin = true;
      }
    }, 400);
  };

  const handleRemoveAccount = async (accountId) => {
    setAccountBusy(true);
    try {
      const next = await removeConnectedLoadTestAccount(accountId);
      syncAccountsList(next);
      setAccountFeedback("Removed Google account from pool.");
    } catch (err) {
      setAccountFeedback(err?.message || "Failed to remove account.");
    } finally {
      setAccountBusy(false);
    }
  };

  const handleClearAccounts = async () => {
    setAccountBusy(true);
    try {
      const next = await clearConnectedLoadTestAccounts();
      syncAccountsList(next);
      setAccountFeedback("Cleared all accounts from load-test pool.");
    } catch (err) {
      setAccountFeedback(err?.message || "Failed to clear accounts.");
    } finally {
      setAccountBusy(false);
    }
  };

  const applyPreset = (preset) => {
    setUploadCount(preset.uploadCount);
    setGenerateCount(preset.generateCount);
    setFolderCount(preset.folderCount);
    setMoveMediaCount(preset.moveMediaCount);
    setMoveFolderCount(preset.moveFolderCount);
    setDurationSeconds(preset.durationSeconds);
    setConcurrency(preset.concurrency);
    setCreateProjectStage(preset.stages.createProject);
    setCreateFoldersStage(preset.stages.createFolders);
    setMoveMediaStage(preset.stages.moveMedia);
    setMoveFolderStage(preset.stages.moveFolder);
    setDeleteMediaStage(preset.stages.deleteMedia);
    setCleanupProjectStage(preset.stages.cleanupProject);
    setActionMessage(`Preset applied: ${preset.label}`);
  };

  const handleStart = async () => {
    if (isRunning) return;
    if (selectedAccounts.length === 0) {
      setActionMessage("Connect and enable at least 1 Google account first.");
      return;
    }
    if (!createProjectStage && selectedAccounts.length > 1) {
      setActionMessage("Enable 'Create Project' when running multiple Google accounts simultaneously (each account needs its own project).");
      return;
    }
    if (!createProjectStage && !manualProjectId.trim()) {
      setActionMessage("Provide an existing Project ID or enable Create Project.");
      return;
    }
    if (generateCount > 0 && !selectedModel.trim()) {
      setActionMessage("Select a model (or set Generate count to 0).");
      return;
    }

    setActionMessage("");
    setCleanedProjects({});
    setIsRunning(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const finalResult = await runMultiAccountLoadTest(
        selectedAccounts,
        {
          uploadCount: Number(uploadCount) || 0,
          generateCount: Number(generateCount) || 0,
          folderCount: Number(folderCount) || 0,
          moveMediaCount: Number(moveMediaCount) || 0,
          moveFolderCount: Number(moveFolderCount) || 0,
          durationSeconds: Number(durationSeconds) || 0,
          concurrency: Number(concurrency) || 1,
          generateModel: selectedModel,
          generateRatio,
          isVideoModel: activeModelObj?.domain === "video",
          projectId: createProjectStage ? "" : manualProjectId.trim(),
          stages: {
            createProject: createProjectStage,
            createFolders: createFoldersStage && Number(folderCount) > 0,
            upload: Number(uploadCount) > 0,
            generate: Number(generateCount) > 0,
            moveMedia: moveMediaStage && Number(moveMediaCount) > 0,
            moveFolder: moveFolderStage && Number(moveFolderCount) > 0,
            deleteMedia: deleteMediaStage,
            cleanupProject: cleanupProjectStage,
          },
        },
        {
          signal: controller.signal,
          onUpdate: (next) => setSnapshot(next),
        }
      );
      setSnapshot(finalResult);
    } finally {
      abortControllerRef.current = null;
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setActionMessage("Abort signal sent to all running Google accounts.");
  };

  const handleCleanupSingleProject = async ({ accountId, accountLabel, projectId }) => {
    if (!projectId || cleanupBusyId) return;
    setCleanupBusyId(projectId);
    setActionMessage("");
    try {
      await deleteLoadTestProject(projectId, { accountId });
      setCleanedProjects((prev) => ({ ...prev, [projectId]: true }));
      setActionMessage(`Deleted project ${projectId} (${accountLabel}).`);
    } catch (err) {
      setActionMessage(`Cleanup failed for ${accountLabel} (${err?.status || "err"}): ${err?.message || "Unknown error"}`);
    } finally {
      setCleanupBusyId("");
    }
  };

  const handleCleanupAllProjects = async () => {
    if (uncleanedProjects.length === 0 || cleanupBusyId) return;
    setCleanupBusyId("ALL");
    setActionMessage("");
    let okCount = 0;
    const errors = [];
    for (const item of uncleanedProjects) {
      try {
        await deleteLoadTestProject(item.projectId, { accountId: item.accountId });
        setCleanedProjects((prev) => ({ ...prev, [item.projectId]: true }));
        okCount += 1;
      } catch (err) {
        errors.push(`${item.accountLabel}: ${err?.message || "failed"}`);
      }
    }
    setCleanupBusyId("");
    setActionMessage(
      errors.length > 0
        ? `Deleted ${okCount} project(s). Errors: ${errors.join(" | ")}`
        : `Deleted all ${okCount} test project(s).`
    );
  };

  const handleExportJson = () => {
    if (!snapshot) return;
    const report = buildExportReport(snapshot, {
      apiBaseUrl,
      accounts: selectedAccounts.map((a) => ({ id: a.id, email: a.email, name: a.name })),
    });
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `load-test-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-canvas-bg text-text-primary p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header & Multi-Account Google Pool */}
        <SectionCard className="flex flex-col gap-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">DEV ONLY</Badge>
                <Badge variant="outline">GOOGLE OAUTH ONLY</Badge>
                <Badge variant="outline">API: {apiBaseUrl}</Badge>
                {snapshot?.status && (
                  <Badge variant={getStatusBadgeVariant(snapshot.status)}>
                    {snapshot.status.toUpperCase()}
                  </Badge>
                )}
              </div>
              <h1 className="ds-text-h-md text-text-primary">Multi-Account API Load & Stress Test Lab</h1>
              <p className="ds-text-caption-l text-text-secondary">
                Connect multiple Google accounts into one shared test pool and attack the real API simultaneously in a single test run.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConnectGooglePopup}
                disabled={isRunning || accountBusy}
              >
                <HugeIcon name="google" size="sm" />
                {oauthPending ? "Waiting for Google…" : "+ Connect Google Account"}
              </Button>
              <Button
                type="button"
                variant="tonal"
                size="sm"
                onClick={() => captureSession({ silent: false })}
                disabled={isRunning || accountBusy}
              >
                Capture Current Session
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refreshPool({ silent: false })}
                disabled={isRunning || accountBusy}
              >
                Refresh Pool
              </Button>
              {accounts.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAccounts}
                  disabled={isRunning || accountBusy}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Connected Google Accounts List */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ds-text-caption-m font-semibold text-text-secondary uppercase">
                  Connected Google Accounts ({selectedAccounts.length} / {accounts.length} active for test)
                </span>
                {currentBrowserUser?.email && (
                  <Badge variant="default" size="sm">
                    Browser cookie: {currentBrowserUser.email}
                  </Badge>
                )}
              </div>
              <span className="ds-text-caption-s text-text-secondary">
                Need another Gmail? Sign in via popup, or open this URL in Incognito / another Chrome profile and click Connect Google — it joins this same pool automatically.
              </span>
            </div>

            {accounts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-wrap items-center justify-between gap-3">
                <p className="ds-text-caption-l text-text-secondary">
                  No Google accounts in the pool yet. Click <span className="text-text-primary font-semibold">+ Connect Google Account</span> to sign in and add your first Google account.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {accounts.map((acc) => {
                  const enabled = selectedAccountIds[acc.id] !== false;
                  return (
                    <div
                      key={acc.id}
                      className="px-4 py-3 rounded-2xl bg-surface-card border border-border-subtle flex items-center justify-between gap-3"
                    >
                      <label className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) =>
                            setSelectedAccountIds((prev) => ({ ...prev, [acc.id]: Boolean(checked) }))
                          }
                          disabled={isRunning}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="ds-text-caption-l font-semibold text-text-primary truncate">
                            {acc.email}
                          </span>
                          <span className="ds-text-caption-s text-text-secondary truncate">
                            {acc.name ? `${acc.name} · ` : ""}
                            {enabled ? "Included in run" : "Paused"}
                          </span>
                        </div>
                      </label>
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${acc.email}`}
                        onClick={() => handleRemoveAccount(acc.id)}
                        disabled={isRunning || accountBusy}
                      >
                        <HugeIcon name="cancel-01" size="sm" />
                      </IconButton>
                    </div>
                  );
                })}
              </div>
            )}

            {accountFeedback && (
              <p className="ds-text-caption-m text-text-secondary">{accountFeedback}</p>
            )}
          </div>
        </SectionCard>

        {/* Presets & Configuration (per account) */}
        <SectionCard className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="ds-text-caption-m font-semibold text-text-secondary uppercase">
                Quick Presets (Per Google Account)
              </span>
              {selectedAccounts.length > 1 && (
                <Badge variant="warning">
                  × {selectedAccounts.length} Google accounts simultaneously
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="pill"
                  size="sm"
                  disabled={isRunning}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              type="number"
              min={0}
              max={500}
              label="Upload Count / Account"
              value={uploadCount}
              onChange={(e) => setUploadCount(Math.max(0, Number(e.target.value) || 0))}
              disabled={isRunning}
            />
            <Input
              type="number"
              min={0}
              max={200}
              label="Generate Count / Account"
              value={generateCount}
              onChange={(e) => setGenerateCount(Math.max(0, Number(e.target.value) || 0))}
              disabled={isRunning}
            />
            <Input
              type="number"
              min={0}
              max={200}
              label="Folder Count / Account"
              value={folderCount}
              onChange={(e) => setFolderCount(Math.max(0, Number(e.target.value) || 0))}
              disabled={isRunning}
            />
            <Input
              type="number"
              min={0}
              max={500}
              label="Move Media / Account"
              value={moveMediaCount}
              onChange={(e) => setMoveMediaCount(Math.max(0, Number(e.target.value) || 0))}
              disabled={isRunning}
            />
            <Input
              type="number"
              min={0}
              max={200}
              label="Move Folder / Account"
              value={moveFolderCount}
              onChange={(e) => setMoveFolderCount(Math.max(0, Number(e.target.value) || 0))}
              disabled={isRunning}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              type="number"
              min={0}
              max={3600}
              label="Duration (s, 0=burst)"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Math.max(0, Number(e.target.value) || 0))}
              disabled={isRunning}
            />
            <Input
              type="number"
              min={1}
              max={10}
              label="Concurrency / Account (1-10)"
              value={concurrency}
              onChange={(e) => setConcurrency(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
              disabled={isRunning}
            />

            <div className="flex flex-col gap-1.5">
              <label className="ds-text-caption-m font-semibold text-text-primary">
                Generation Model
              </label>
              {models.length > 0 ? (
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isRunning}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder={modelsLoading ? "Loading models…" : "Select model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id} badge={m.domain}>
                        {m.name || m.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="text"
                  placeholder={modelsLoading ? "Loading…" : "model-id"}
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isRunning}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="ds-text-caption-m font-semibold text-text-primary">
                Aspect Ratio
              </label>
              <Select value={generateRatio} onValueChange={setGenerateRatio} disabled={isRunning}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="1:1" />
                </SelectTrigger>
                <SelectContent>
                  {RATIO_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-subtle">
            <div className="flex flex-wrap items-center gap-5">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <Switch
                  checked={createProjectStage}
                  onCheckedChange={setCreateProjectStage}
                  disabled={isRunning}
                />
                <span className="ds-text-caption-l text-text-primary">Create Project</span>
              </label>

              {!createProjectStage && selectedAccounts.length <= 1 && (
                <Input
                  type="text"
                  placeholder="Existing Project ID"
                  value={manualProjectId}
                  onChange={(e) => setManualProjectId(e.target.value)}
                  disabled={isRunning}
                  className="w-56"
                />
              )}

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <Switch
                  checked={createFoldersStage}
                  onCheckedChange={setCreateFoldersStage}
                  disabled={isRunning}
                />
                <span className="ds-text-caption-l text-text-primary">Create Folders</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <Switch
                  checked={moveMediaStage}
                  onCheckedChange={setMoveMediaStage}
                  disabled={isRunning}
                />
                <span className="ds-text-caption-l text-text-primary">Move Media</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <Switch
                  checked={moveFolderStage}
                  onCheckedChange={setMoveFolderStage}
                  disabled={isRunning}
                />
                <span className="ds-text-caption-l text-text-primary">Move Folders</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <Switch
                  checked={deleteMediaStage}
                  onCheckedChange={setDeleteMediaStage}
                  disabled={isRunning}
                />
                <span className="ds-text-caption-l text-text-primary">Delete Media</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <Switch
                  checked={cleanupProjectStage}
                  onCheckedChange={setCleanupProjectStage}
                  disabled={isRunning}
                />
                <span className="ds-text-caption-l text-text-primary">Auto-Cleanup Project</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="m"
                onClick={handleStart}
                disabled={isRunning || selectedAccounts.length === 0}
              >
                <HugeIcon name="play" size="sm" />
                {isRunning
                  ? `Running (${selectedAccounts.length} accs)…`
                  : selectedAccounts.length > 1
                    ? `Start Test (${selectedAccounts.length} Accounts)`
                    : "Start Test"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="m"
                onClick={handleStop}
                disabled={!isRunning}
              >
                <HugeIcon name="pause" size="sm" />
                Stop All
              </Button>
              <Button
                type="button"
                variant="tonal"
                size="m"
                onClick={handleCleanupAllProjects}
                disabled={isRunning || Boolean(cleanupBusyId) || uncleanedProjects.length === 0}
              >
                {cleanupBusyId === "ALL"
                  ? "Cleaning…"
                  : `Cleanup All Projects (${uncleanedProjects.length})`}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="m"
                onClick={handleExportJson}
                disabled={!snapshot}
              >
                Export JSON
              </Button>
            </div>
          </div>

          {actionMessage && (
            <p className="ds-text-caption-m text-accent-yellow">{actionMessage}</p>
          )}
        </SectionCard>

        {/* Live Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col gap-1">
            <span className="ds-text-caption-s text-text-secondary uppercase">Elapsed / Progress</span>
            <span className="ds-text-h-sm font-mono tabular-nums text-text-primary">
              {formatElapsed(snapshot?.elapsedMs)} ({progressPct}%)
            </span>
            <span className="ds-text-caption-s text-text-secondary font-mono tabular-nums truncate">
              {snapshot?.completedOps ?? 0} / {snapshot?.plannedOps ?? 0} reqs · {snapshot?.currentStage || "idle"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col gap-1">
            <span className="ds-text-caption-s text-text-secondary uppercase">Success Rate</span>
            <span className="ds-text-h-sm font-mono tabular-nums text-text-primary">
              {successRate}
            </span>
            <span className="ds-text-caption-s text-text-secondary font-mono tabular-nums">
              {overall?.ok ?? 0} ok · {overall?.failed ?? 0} failed
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col gap-1">
            <span className="ds-text-caption-s text-text-secondary uppercase">Latency (Avg / p50 / p95)</span>
            <span className="ds-text-h-sm font-mono tabular-nums text-text-primary">
              {overall?.avgMs ?? 0} ms
            </span>
            <span className="ds-text-caption-s text-text-secondary font-mono tabular-nums">
              p50 {overall?.p50Ms ?? 0} · p95 {overall?.p95Ms ?? 0} · max {overall?.maxMs ?? 0} ms
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col gap-1">
            <span className="ds-text-caption-s text-text-secondary uppercase">Combined Throughput</span>
            <span className="ds-text-h-sm font-mono tabular-nums text-text-primary">
              {snapshot?.throughputPerMin ?? 0} req/min
            </span>
            <span className="ds-text-caption-s text-text-secondary truncate">
              Accounts: {snapshot?.accountCount ?? selectedAccounts.length} · Projects: {snapshot?.createdProjects?.length ?? 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col gap-1">
            <span className="ds-text-caption-s text-text-secondary uppercase">Errors (429 / 409 / 5xx)</span>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Badge variant={(overall?.status429 || 0) > 0 ? "warning" : "default"}>
                429: {overall?.status429 ?? 0}
              </Badge>
              <Badge variant={(overall?.status409 || 0) > 0 ? "warning" : "default"}>
                409: {overall?.status409 ?? 0}
              </Badge>
              <Badge variant={(overall?.status5xx || 0) > 0 ? "danger" : "default"}>
                5xx: {overall?.status5xx ?? 0}
              </Badge>
            </div>
            <span className="ds-text-caption-s text-text-secondary font-mono tabular-nums">
              Media: {snapshot?.createdWorkflowIds?.length ?? 0} · Folders: {snapshot?.createdFolderIds?.length ?? 0}
            </span>
          </div>
        </div>

        {/* Per-Account Breakdown Table */}
        {snapshot?.accounts?.length > 0 && (
          <SectionCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="ds-text-h-xs text-text-primary">Per-Account Breakdown</h2>
              <span className="ds-text-caption-m text-text-secondary">
                {snapshot.accounts.length} Google account(s) running concurrently
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle ds-text-caption-s text-text-secondary uppercase">
                    <th className="py-2 pr-4">Google Account</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Stage</th>
                    <th className="py-2 px-2">OK / Total</th>
                    <th className="py-2 px-2">Fail</th>
                    <th className="py-2 px-2">429</th>
                    <th className="py-2 px-2">409</th>
                    <th className="py-2 px-2">5xx</th>
                    <th className="py-2 px-2">Avg (ms)</th>
                    <th className="py-2 px-2">p95 (ms)</th>
                    <th className="py-2 pl-2">Project</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle ds-text-caption-m font-mono tabular-nums">
                  {snapshot.accounts.map((acc) => {
                    const isCleaned = Boolean(acc.projectId && cleanedProjects[acc.projectId]);
                    return (
                      <tr key={acc.id}>
                        <td className="py-2.5 pr-4 font-sans text-text-primary font-medium">{acc.email}</td>
                        <td className="py-2.5 px-2">
                          <Badge variant={getStatusBadgeVariant(acc.status)} size="sm">
                            {acc.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-text-secondary">{acc.currentStage}</td>
                        <td className="py-2.5 px-2 text-emerald-400">
                          {acc.overall?.ok ?? 0} / {acc.overall?.total ?? 0}
                        </td>
                        <td className="py-2.5 px-2 text-error">{acc.overall?.failed ?? 0}</td>
                        <td className="py-2.5 px-2 text-accent-yellow">{acc.overall?.status429 ?? 0}</td>
                        <td className="py-2.5 px-2 text-accent-yellow">{acc.overall?.status409 ?? 0}</td>
                        <td className="py-2.5 px-2 text-error">{acc.overall?.status5xx ?? 0}</td>
                        <td className="py-2.5 px-2 text-text-primary">{acc.overall?.avgMs ?? 0}</td>
                        <td className="py-2.5 px-2 text-text-secondary">{acc.overall?.p95Ms ?? 0}</td>
                        <td className="py-2.5 pl-2">
                          {acc.projectId ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isRunning || Boolean(cleanupBusyId) || isCleaned}
                              onClick={() =>
                                handleCleanupSingleProject({
                                  accountId: acc.id,
                                  accountLabel: acc.email,
                                  projectId: acc.projectId,
                                })
                              }
                            >
                              {isCleaned
                                ? "Deleted"
                                : cleanupBusyId === acc.projectId
                                  ? "Deleting…"
                                  : "Cleanup"}
                            </Button>
                          ) : (
                            <span className="text-text-disabled">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* Per-Stage Breakdown Table */}
        <SectionCard className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="ds-text-h-xs text-text-primary">Per-Stage Breakdown (Combined)</h2>
            <span className="ds-text-caption-m text-text-secondary">
              Exact stats computed across all {snapshot?.totalLogged ?? 0} requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle ds-text-caption-s text-text-secondary uppercase">
                  <th className="py-2 pr-4">Stage</th>
                  <th className="py-2 px-2">Total</th>
                  <th className="py-2 px-2">OK</th>
                  <th className="py-2 px-2">Fail</th>
                  <th className="py-2 px-2">429</th>
                  <th className="py-2 px-2">409</th>
                  <th className="py-2 px-2">5xx</th>
                  <th className="py-2 px-2">Min (ms)</th>
                  <th className="py-2 px-2">Avg (ms)</th>
                  <th className="py-2 px-2">p50 (ms)</th>
                  <th className="py-2 px-2">p95 (ms)</th>
                  <th className="py-2 pl-2">Max (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle ds-text-caption-m font-mono tabular-nums">
                {STAGE_LABELS.map(([key, label]) => {
                  const row = snapshot?.stages?.[key];
                  return (
                    <tr key={key}>
                      <td className="py-2.5 pr-4 font-sans text-text-primary font-medium">{label}</td>
                      <td className="py-2.5 px-2 text-text-primary">{row?.total ?? 0}</td>
                      <td className="py-2.5 px-2 text-emerald-400">{row?.ok ?? 0}</td>
                      <td className="py-2.5 px-2 text-error">{row?.failed ?? 0}</td>
                      <td className="py-2.5 px-2 text-accent-yellow">{row?.status429 ?? 0}</td>
                      <td className="py-2.5 px-2 text-accent-yellow">{row?.status409 ?? 0}</td>
                      <td className="py-2.5 px-2 text-error">{row?.status5xx ?? 0}</td>
                      <td className="py-2.5 px-2 text-text-secondary">{row?.minMs ?? 0}</td>
                      <td className="py-2.5 px-2 text-text-primary">{row?.avgMs ?? 0}</td>
                      <td className="py-2.5 px-2 text-text-secondary">{row?.p50Ms ?? 0}</td>
                      <td className="py-2.5 px-2 text-text-secondary">{row?.p95Ms ?? 0}</td>
                      <td className="py-2.5 pl-2 text-text-secondary">{row?.maxMs ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Live Request Log */}
        <SectionCard className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="ds-text-h-xs text-text-primary">Live Request Log</h2>
            <span className="ds-text-caption-m text-text-secondary">
              Showing latest {snapshot?.recentLog?.length ?? 0} of {snapshot?.totalLogged ?? 0} requests
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar flex flex-col divide-y divide-border-subtle">
            {!snapshot?.recentLog?.length ? (
              <p className="py-8 text-center ds-text-caption-l text-text-secondary">
                No requests recorded yet. Connect 1+ Google accounts above and click Start Test.
              </p>
            ) : (
              snapshot.recentLog.map((entry) => (
                <div
                  key={entry.id}
                  className="py-2 flex flex-wrap items-center justify-between gap-2 ds-text-caption-m font-mono tabular-nums"
                >
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-text-disabled">#{entry.id}</span>
                    {entry.accountLabel && (
                      <Badge variant="default" size="sm">
                        {formatShortAccount(entry.accountLabel)}
                      </Badge>
                    )}
                    <Badge variant="outline" size="sm">{entry.stage}</Badge>
                    <Badge variant={getHttpBadgeVariant(entry)} size="sm">
                      {entry.status || "ERR"}
                    </Badge>
                    <span className="text-text-secondary">{entry.method}</span>
                    <span className="text-text-primary truncate">{entry.endpoint}</span>
                    {entry.errorCode && (
                      <Badge variant="warning" size="sm">{entry.errorCode}</Badge>
                    )}
                    {!entry.ok && entry.message && (
                      <span className="text-error truncate font-sans">{entry.message}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-text-primary">{entry.latencyMs} ms</span>
                    <span className="text-text-disabled">{entry.timestamp.slice(11, 19)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
