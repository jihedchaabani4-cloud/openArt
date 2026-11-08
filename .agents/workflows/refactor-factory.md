---
name: refactor-factory
description: Multi-Agent Clean Code & Architecture Factory for systematic, peer-reviewed refactoring of features into pure FSD.
---

# Multi-Agent Refactoring Factory

An assembly-line pipeline for systematically cleaning, modularizing, and architecting codebase feature slices into pure Feature-Sliced Design (FSD), Clean Code, and high testability.

## Pipeline Stages

1. **Feature Analyst Agent** (`codebase-design`, `ponytail`)
   - Scans the selected feature slice.
   - Catalogues loose files, misplaced hooks, leaky UI/logic boundaries, dead code, and external consumers.

2. **Architecture Planner Agent** (`improve-codebase-architecture`)
   - Designs the target canonical FSD slice structure (`ui/`, `model/`, `api/`, `core/` or `lib/`, `index.js`).
   - Ensures deep module principles: clean public surface, hidden internal complexity.

3. **Plan Reviewer Agent** (`grilling`, `clean-code-guard`)
   - Pressure-tests the plan against YAGNI, over-engineering risks, breaking changes, and regression risks.

4. **Ticket Decomposer Agent** (`to-tickets`)
   - Breaks approved plan into atomic, vertical or expand-contract tickets with clear definitions of done.

5. **Ticket Reviewer Agent** (`wayfinder`)
   - Verifies ticket ordering, dependency graph, and testability.

6. **Execution Agent** (`implement`, `test-first`)
   - Executes tickets incrementally, maintaining 100% green test passes after each operation.

7. **Quality Gate Agent** (`clean-code-guard`, `test-guard`, `ui-system-first`)
   - Enforces zero new UI ratchet violations (`npm run ui:check`).
   - Enforces full test suite pass (`npx vitest run`).
   - Verifies clean git commits.
