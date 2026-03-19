// src/components/features/ImagePromptBar/api/generations.api.js
import { api } from "@/lib/api";

export const postGenerate = (payload) => {
  return api.post("/generations/generate", payload);
};

export const postWhatsNext = (payload) => {
  return api.post("/vision/whats-next", payload);
};
