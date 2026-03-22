// [FSD Layer: features/prompt-bar] — Direct API helpers (non-React-Query)
// postGenerate and postGenerateVideo have been replaced by useGenerateMutation in generationsApi.js
import { api } from "@/shared/api/client";

export const postWhatsNext = (payload) => {
  return api.post("/vision/whats-next", payload);
};
