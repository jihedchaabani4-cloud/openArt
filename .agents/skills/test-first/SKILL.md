---
name: test-first
description: Use for every behavior change or new code in apiOpenArt or my-app.
---
1. Write the failing test first; run only that file; confirm it fails for the right reason.
2. Make the smallest change to turn it green.
3. Add the failure-path cases: wrong user/project = 404, partial failure (what is kept vs deleted), unknown result on a destructive path = keep the data, called twice.
4. Break the code once on purpose to prove the test can fail, then restore it.
5. Backend: run `npm run gate` and paste the GATE SUMMARY. Frontend: `npm run ui:check` plus the project tests.
6. Never edit or remove an existing test to make it pass.
