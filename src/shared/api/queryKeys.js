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

    // ── Workflows ─────────────────────────────────────────────────────────────
    workflows: {
        all:       ()                          => ['workflows'],
        byProject: (projectId, sessionId)      => ['workflows', projectId, sessionId],
        paginated: (page)                      => ['allWorkflows', page],
    },

    // ── Backward Compat: generations ──────────────────────────────────────────
    generations: {
        all:       ()                          => ['workflows'],
        byProject: (projectId, sessionId)      => ['workflows', projectId, sessionId],
    },

    // ── Assets ────────────────────────────────────────────────────────────────
    assets: {
        all:       ()                                     => ['assets'],
        byProject: (projectId, offset, type, mediaType)   => ['assets', projectId, offset, type, mediaType],
    },

    // ── Models ────────────────────────────────────────────────────────────────
    models: {
        studio: () => ['studioModels'],
    },

    // ── Project Data (Unified: sessions + collections + workflows + media) ────
    projectData: {
        byProject:           (projectId)             => ['projectData', projectId],
        byProjectAndSession: (projectId, sessionId)  => ['projectData', projectId, sessionId],
    },
};
