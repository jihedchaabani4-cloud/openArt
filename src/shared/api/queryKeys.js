// [FSD Layer: shared/api] — Centralized React Query key factory
// Use these exclusively — no raw string arrays in any queryKey field.

export const queryKeys = {
    // ── Projects ──────────────────────────────────────────────────────────────
    projects: {
        all:  ()           => ['projects'],
        list: ()           => ['projects', 'list'],
    },

    // ── Sessions ──────────────────────────────────────────────────────────────
    sessions: {
        all:       ()            => ['sessions'],
        byProject: (projectId)   => ['sessions', projectId],
    },

    // ── Generations ───────────────────────────────────────────────────────────
    generations: {
        all:       ()                          => ['generations'],
        byProject: (projectId, sessionId)      => ['generations', projectId, sessionId],
        paginated: (page)                      => ['allGenerations', page],
    },

    // ── Assets ────────────────────────────────────────────────────────────────
    assets: {
        all:       ()                          => ['assets'],
        byProject: (projectId, sessionId)      => ['assets', projectId, sessionId],
    },

    // ── Models ────────────────────────────────────────────────────────────────
    models: {
        studio: () => ['studioModels'],
    },
};
