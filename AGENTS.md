## Project rules
- Before any task, read docs/prompt-bar-plan/00_CORE.md and the phase file the human names. The plan files win over any Spec Kit file.
- One commit per task (`pb<N>(<id>)`). Failing test first. Full `npm test` before every commit (no network, no backend).
- Secrets scan on `git diff --cached` before every commit.
- No console.* in new code. Never log prompts, tokens or signed URLs.
- Never push, tag, merge, or edit the backend. No new dependencies.
- No render side effects, no module-level "active bar" variable, no new exhaustive-deps disables.
- Never rename or move existing exports without leaving a shim at the old path.
- No visual change.
- Every id from a client must be ownership-checked and project-scoped. Cross-tenant access returns 404, never 403.
- Additive migrations only. Never rename existing tables, columns, classes or routes.

## Architecture rules
- Routes and controllers only: parse the request, call ONE service method, map the result to HTTP. No business logic, no direct db/supabase calls, no ownership logic inside routes or controllers.
- Each concern lives in ONE service (folders -> FolderService, asset move/listing -> the existing workflow/generation service, etc.). Before writing code, search for the existing service and extend it. Create a new service only if no existing one owns that concern.
- Services call repositories; repositories only talk to the DB, always scoped by user and project.
- No duplicated logic: if the same check or rule appears in two places, move it into the owning service and call it from both.
- A service has a short header comment: what it owns, and its public methods.
- Refactors that move code are a separate task with their own commit and no behavior change; existing tests must pass unchanged.

## Prompt bar plan rules
- Before any task, read docs/prompt-bar-plan/00_CORE.md and the phase file the human names. The plan files win over any Spec Kit file.
- One commit per task (`pb<N>(<id>)`). Failing test first. Full `npm test` before every commit (no network, no backend).
- Secrets scan on `git diff --cached` before every commit.
- No console.* in new code. Never log prompts, tokens or signed URLs.
- Never push, tag, merge, or edit the backend. No new dependencies.
- No render side effects, no module-level "active bar" variable, no new exhaustive-deps disables.
- Never rename or move existing exports without leaving a shim at the old path.
- No visual change.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/033-prompt-bar-platform/plan.md
<!-- SPECKIT END -->
