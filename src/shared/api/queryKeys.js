export const queryKeys = {
  auth: {
    me: () => ["auth", "me"],
    walletBalance: () => ["auth", "walletBalance"],
  },

  projects: {
    all: () => ["projects"],
    list: () => ["projects", "list"],
  },

  sessions: {
    all: () => ["sessions"],
    byProject: (projectId) => ["sessions", projectId],
  },

  workflows: {
    all: () => ["workflows"],
    byProject: (projectId, sessionId) => ["workflows", projectId, sessionId],
    paginated: (page) => ["allWorkflows", page],
  },

  generations: {
    all: () => ["workflows"],
    byProject: (projectId, sessionId) => ["workflows", projectId, sessionId],
  },

  assets: {
    all: () => ["assets"],
    byProject: (projectId, offset, type, mediaType) => ["assets", projectId, offset, type, mediaType],
  },

  library: {
    all: () => ["library"],
    user: (params = {}) => ["library", "user", params],
    detail: (workflowId) => ["library", "detail", workflowId],
  },

  models: {
    studio: () => ["studioModels"],
  },

  projectData: {
    byProject: (projectId) => ["projectData", projectId],
    byProjectAndSession: (projectId, sessionId) => ["projectData", projectId, sessionId],
  },
}
