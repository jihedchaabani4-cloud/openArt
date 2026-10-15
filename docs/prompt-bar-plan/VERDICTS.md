# Phase P1: Claims Verdicts

> Generated in Phase P1 as required by `02_P1_verification_audits.md`.
> Every verdict is backed by concrete code citations and execution evidence from reports V1 to V6.

## Verification Matrix

| Claim | Source | Verdict | Evidence | Plan impact |
|---|---|---|---|---|
| Hydration mismatch between server and client keys | audit 3.5 | CONFIRMED | `reports/V1.md` (`resolveProjectId.js:12-25`, `createPromptBarStore.js:255`) | S3 (two-phase mount / SSR-safe hydration) is mandatory in P3 to eliminate SSR key mismatch. |
| Generate stays blocked after navigation | audit 3.4 | PARTIAL | `reports/V5.md` (`createPromptBarStore.js:143`, `useGenerateMediaMutation.js:176`) | S4 in P3 must ensure `isGenerating` is reset on store mount/lifecycle rather than preserved across navigation. |
| Animate relies on `input_image` carry-over | discussion | REFUTED | `reports/V4.md` (`useMediaActions.js:480`) | PB-D-03 (wiping mode-specific parameters on mode switch) will not break Animate. T3 in P4 can proceed safely. |
| Backend ignores undeclared parameters | PB-D-12 | REFUTED (NOT SAFE to leak) | `reports/V3.md` (`apiOpenArt/schemaValidator.js:151-161`, `modelRunner.js:63-65`) | T1 in P4 is mandatory: backend strictly rejects undeclared parameters with `UnknownParameterError`. |
| Two bars can be mounted at once | PB-D-05 | CONFIRMED | `reports/V1.md` (`prompt-bar-compare/page.jsx:24,31`) | `instanceId`-scoped store (S1) is necessary to support side-by-side or modal bars without singleton collisions. |
| Legacy store duplicates prompt/model/mode | audit 2.4 | CONFIRMED | `reports/V2.md` (`useMediaActions.js:149-181`, `CONSUMERS.md`) | Defines migration scope for X4/X5 in P5: migrate 4 duplicated consumers, keep 13 drag/trait consumers. |

## Tasks in P3 to P5 That Become Unnecessary or Need a Change

- **Phase P3**: S3 (SSR hydration safety) is confirmed critical and cannot be deferred; S4 scope is clarified to ensure in-memory store unconditionally resets `isGenerating: false` on store initialization/mount.
- **Phase P4**: T1 (strict declared-parameter serialization) is confirmed mandatory (leaking undeclared keys causes backend 400 errors); T3 (wipe mode parameters on mode switch per PB-D-03) is safe to proceed without breaking Animate.
- **Phase P5**: X4 and X5 migration scope is cleanly bounded to the 4 `MIGRATE` consumers identified in `CONSUMERS.md`; no changes needed to drag state or character forms (13 `KEEP` consumers).
