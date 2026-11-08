---
name: use-or-add-service
description: Use before adding or changing any backend service, repository method, or call between services in apiOpenArt.
---
1. Open `apiOpenArt/docs/agents/service-catalog.md` and find the concern. Also read `docs/agents/rules/services.md`.
2. Owner exists: use it through its injected dependency; add any missing capability to the OWNER with a test first. Never reach into its repository or copy its logic.
3. No owner: create `<Concern>Service.js` with an `@owns` line, a throwing constructor, container registration and a wiring test.
4. Run `npm run catalog` and commit the updated catalog with the change.
5. Report one line: `Owner: <Service> (REUSED | EXTENDED | CREATED)`.
6. A rule found in two places: move it into the owner.
