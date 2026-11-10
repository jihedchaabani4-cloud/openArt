# Antigravity Autonomous Software Factory

This document defines the autonomous Software Factory loop running directly on Antigravity for `my-app`. It implements the exact build → QA → review → merge cycle inspired by `super-board` and Matt Pocock's software factory principles.

---

## 🏗️ Architecture & Roles

```
                           ┌──────────────────────────────┐
                           │      Lead Orchestrator       │
                           │         (Antigravity)        │
                           └──────────────┬───────────────┘
                                          │ 1. Dispatches ACs
                                          ▼
   ┌───────────────────────► ┌──────────────────────────┐
   │                         │     factory_builder      │
   │                         │  - TDD (Red-Green-Refactor)
   │                         │  - Minimalist safe changes│
   │  Fix Feedback Loop      │  - Respects AGENTS.md    │
   │                         └────────────┬─────────────┘
   │                                      │ 2. Hands off diff & tests
   │                                      ▼
   │                         ┌──────────────────────────┐
   ├─────────────────────────┤        factory_qa        │
   │ (If QA fails)           │  - Runs test suite       │
   │                         │  - Runs tsc & build      │
   │                         │  - Edge case probing     │
   │                         └────────────┬─────────────┘
   │                                      │ 3. PASS verdict
   │                                      ▼
   │                         ┌──────────────────────────┐
   └─────────────────────────┤     factory_reviewer     │
     (If changes requested)  │  - Adversarial truth check
                             │  - OWASP & Security audit│
                             │  - Standards verification│
                             └────────────┬─────────────┘
                                          │ 4. APPROVED verdict
                                          ▼
                             ┌──────────────────────────┐
                             │       PR & Landing       │
                             │  - Clean Git commit      │
                             │  - PR summary / landed   │
                             └──────────────────────────┘
```

---

## 🤖 Registered Subagents

### 1. `factory_builder`
- **Role:** Implementation specialist.
- **Rules:**
  - Writes tests first (TDD).
  - Makes the smallest safe change satisfying Acceptance Criteria (ACs).
  - Checks design system rules (`AGENTS.md`, tokens, `npm run ui:check`).
  - Self-verifies before handoff.

### 2. `factory_qa`
- **Role:** Independent, skeptical QA & Bug Hunter.
- **Rules:**
  - Verifies build, typecheck, and test runner outputs independently.
  - Probes regressions and edge cases.
  - Zero assumptions: only counts real terminal exit codes and outputs.
  - Returns `[PASS]` or `[FAIL]` with exact reproduction logs.

### 3. `factory_reviewer`
- **Role:** Code standard, truth gate & security auditor.
- **Rules:**
  - Verifies builder claims against actual diff lines.
  - Flags scope creep and over-engineering.
  - Audits security (OWASP, injections, secret leaks, auth protection).
  - Returns `[APPROVED]` or `[CHANGES_REQUESTED]`.

---

## 🚀 How to Run the Factory

Whenever you have a problem, bug, or feature request:
Just say:
> **"Factory: [Describe the problem or feature]"**

The Lead Orchestrator will:
1. Extract or formulate the Acceptance Criteria (ACs).
2. Invoke `factory_builder` to develop the solution with tests.
3. Invoke `factory_qa` to independently stress-test the solution.
4. Invoke `factory_reviewer` to audit security and code quality.
5. If QA or Review flags any defect, feedback is fed back to `factory_builder` until all checks pass.
6. Commit the verified solution and report with full evidence.
