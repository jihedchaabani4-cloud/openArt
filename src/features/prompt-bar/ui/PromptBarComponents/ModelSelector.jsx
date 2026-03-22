"use client"

import React, { useState, useEffect } from "react"
import { SelectorBase } from "./SelectorBase"

// ─── Icons ────────────────────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.7368 2.60967C12.6694 2.25593 12.3601 2 12 2C11.6399 2 11.3306 2.25593 11.2632 2.60967C10.7844 5.12353 9.83969 7.03715 8.43842 8.43842C7.03715 9.83969 5.12353 10.7844 2.60967 11.2632C2.25593 11.3306 2 11.6399 2 12C2 12.3601 2.25593 12.6694 2.60967 12.7368C5.12353 13.2156 7.03715 14.1603 8.43842 15.5616C9.83969 16.9629 10.7844 18.8765 11.2632 21.3903C11.3306 21.7441 11.6399 22 12 22C12.3601 22 12.6694 21.7441 12.7368 21.3903C13.2156 18.8765 14.1603 16.9629 15.5616 15.5616C16.9629 14.1603 18.8765 13.2156 21.3903 12.7368C21.7441 12.6694 22 12.3601 22 12C22 11.6399 21.7441 11.3306 21.3903 11.2632C18.8765 10.7844 16.9629 9.83969 15.5616 8.43842C14.1603 7.03715 13.2156 5.12353 12.7368 2.60967Z" />
  </svg>
)

// ─── Model Avatar ─────────────────────────────────────────────────────────────
const ModelAvatar = ({ familyId }) => {
  const icons = {
    // Images
    flux:       "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/flux.svg",
    seedance:   "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/flux-color.svg",
    midjourney: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/midjourney.svg",
    stability:  "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/stability.svg",
    higgs:      "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/stability-color.svg",
    recraft:    "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/recraft.svg",
    zimage:     "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/zhipu.svg",
    nano:       "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/minimax.svg", // Using minimax as placeholder for nano
    seedream:   "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/baichuan.svg", // Using baichuan as placeholder

    // Video / Motion
    kling:      "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kling.svg",
    "kling-motion": "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kling-color.svg",
    luma:       "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/luma.svg",
    runway:     "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/runway.svg",
    higgsfield: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/stability-color.svg",
    
    // Generic
    openai:     "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg",
    veo:        "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google-color.svg",
    default:    "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lobe.svg",
  }
  
  const iconUrl = icons[familyId] || icons.default
  
  return (
    <div className="size-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.2)] overflow-hidden">
      <img 
        src={iconUrl} 
        alt={familyId} 
        className="size-4.5 object-contain" 
      />
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
export const MODEL_FAMILIES = [
  {
    id: "nano", name: "Nano Banana", type: "image",
    versions: [
      { id: "nanobana_pro",    name: "Nano Banana Pro",    badge: "PREMIUM", subtext: "Pro quality at Flash speed",           featured: true  },
      { id: "nanobana_edit",   name: "Nano Banana Edit",   badge: "NEW",     subtext: "Nano Banana editing model",              featured: false },
      { id: "nanobana_normal", name: "Nano Banana Normal", badge: null,      subtext: "Standard generation model",            featured: false },
    ],
  },
  {
    id: "zimage", name: "Z-Image", type: "image",
    versions: [
      { id: "z-image-pro",      name: "Z-Image Pro",      badge: "PREMIUM", subtext: "State-of-the-art vision", featured: true  },
      { id: "z-image-pro-edit", name: "Z-Image Pro Edit", badge: "PREMIUM", subtext: "Pro-grade intelligent editing", featured: false },
      { id: "z-image-base",     name: "Z-Image Base",     badge: "PREMIUM", subtext: "High-quality model (CFG + Negative Prompt)", featured: false  },
      { id: "z-image-turbo",    name: "Z-Image Turbo",    badge: "FAST",    subtext: "Ultra-fast sub-second generation",  featured: true },
      { id: "z-image-edit",     name: "Z-Image Edit",     badge: "NEW",     subtext: "Intelligent image editing",  featured: false },
      { id: "z-image-normal",   name: "Z-Image",          badge: null,      subtext: "Standard vision model",    featured: false },
      { id: "z-image-lora",     name: "Z-Image LoRA",     badge: "PRO",     subtext: "Base model with LoRA support",    featured: false },
    ],
  },
  {
    id: "seedream", name: "SeaDream", type: "image",
    versions: [
      { id: "seedream",      name: "SeaDream 5.0 Lite",   badge: "NEW",     subtext: "Intelligent visual reasoning",              featured: true  },
      { id: "seedream_edit", name: "SeaDream 5.0 Edit",   badge: "PREMIUM", subtext: "ByteDance's advanced image editing",      featured: false },
    ],
  },
  {
    id: "flux", name: "Flux", type: "image",
    versions: [{ id: "flux", name: "Flux Pro", badge: "PREMIUM", subtext: "Google levels of quality", featured: true }],
  },
  {
    id: "stability", name: "Stable Diffusion", type: "image",
    versions: [{ id: "sdxl", name: "SDXL Ngrok", badge: "BETA", subtext: "Local fallback generator", featured: false }],
  },
  {
    id: "kling", name: "Kling", type: "video",
    versions: [
      { id: "kling-3-pro",   name: "Kling 3 Pro",          badge: "EXCLUSIVE", quality: "4K",    dur: "5–20s", featured: true  },
      { id: "kling-3",       name: "Kling 3",              badge: "NEW",       quality: "1080p", dur: "3–15s", featured: false },
      { id: "kling-2.1-pro", name: "Kling 2.1 Pro",        badge: null,        quality: "1080p", dur: "5–10s", featured: false },
    ],
  },
  {
    id: "higgsfield", name: "Higgsfield", type: "video",
    versions: [
      { id: "higgsfield-soul-2",        name: "Higgsfield Soul 2.0",      badge: "NEW",     subtext: "Next generation ultra-realistic fashion visuals",  featured: true  },
      { id: "higgsfield-soul-cinema",   name: "Higgsfield Soul Cinema",   badge: "PREVIEW", subtext: "Cinematic-grade fashion visuals",                  featured: true  },
    ],
  },
  {
    id: "luma", name: "Luma AI", type: "motion",
    versions: [
      { id: "luma-dream-machine", name: "Dream Machine 1.5", badge: "NEW", subtext: "High-fidelity cinematic motion", featured: true },
    ],
  },
  {
    id: "runway", name: "Runway", type: "motion",
    versions: [
      { id: "runway-gen3", name: "Gen-3 Alpha", badge: "PREMIUM", subtext: "State-of-the-art video generation", featured: true },
    ],
  },
  {
    id: "kling-motion", name: "Kling Motion", type: "motion",
    versions: [
      { id: "kling-motion-control", name: "Motion Control v1", badge: "BETA", subtext: "Precise camera and subject control", featured: false },
    ],
  },
]

export const ALL_MODELS = MODEL_FAMILIES.flatMap(f => f.versions.map(v => ({ 
  ...v, 
  familyId: f.id, 
  type: f.type,
  value: v.id, 
  label: v.name,
  icon: <ModelAvatar familyId={f.id} />
})))

const getFamilyId = (key) => {
  if (!key) return "default";
  const k = key.toLowerCase();
  if (k.includes("nanobana")) return "nano";
  if (k.includes("z-image") || k.includes("z_image"))  return "zimage";
  if (k.includes("seedream")) return "seedream";
  if (k.includes("kling"))    return "kling";
  if (k.includes("luma"))     return "luma";
  if (k.includes("runway"))   return "runway";
  if (k.includes("higgs"))    return "higgsfield";
  if (k.includes("flux"))     return "flux";
  if (k.includes("sdxl"))     return "stability";
  return "default";
};

export function ModelSelector({ type = "video", defaultId, onChange, dynamicModels, loading }) {
  // Normalize type (e.g., motion-control -> motion)
  const normalizedType = type?.includes("motion") ? "motion" : type

  const mergedModels = React.useMemo(() => {
    return (dynamicModels || []).map(apiModel => {
      const familyId = getFamilyId(apiModel.key);
      const featured = apiModel.tags?.includes("fast") || apiModel.tags?.includes("hd");
      
      let badge = null;
      if (apiModel.requiresPro) {
        badge = "PREMIUM";
      } else if (apiModel.tags?.length > 0) {
        badge = apiModel.tags[0].toUpperCase();
      }
      console.log(apiModel)
      return {
        id: apiModel.key,
        name: apiModel.displayName || apiModel.key,
        badge,
        subtext: apiModel.tags?.join(" • ") || "",
        featured,
        familyId,
        type: apiModel.category || "image",
        value: apiModel.key,
        label: apiModel.displayName || apiModel.key,
        icon: <ModelAvatar familyId={familyId} />,
        maxReferences: apiModel.maxReferences ?? 1
      };
    });
  }, [dynamicModels]);

  const filteredAllModels = mergedModels.filter(m => m.type === normalizedType)
  const featuredModels = filteredAllModels.filter(m => m.featured)
  const otherModels = filteredAllModels.filter(m => !m.featured)

  const initialId = defaultId || (filteredAllModels.length > 0 ? filteredAllModels[0].id : null)
  const [selectedId, setSelectedId] = useState(initialId)

  useEffect(() => {
    if (defaultId) {
      setSelectedId(defaultId)
    }
  }, [defaultId])

  useEffect(() => {
    if (selectedId && !filteredAllModels.some(m => m.id === selectedId)) {
      if (filteredAllModels.length > 0) setSelectedId(filteredAllModels[0].id)
    }
  }, [type])

  const selectedModel = filteredAllModels.find(v => v.id === selectedId) || filteredAllModels[0]
  if (!selectedModel) return null

  const handleSelect = (value) => {
    const model = filteredAllModels.find(m => m.id === value)
    setSelectedId(value)
    onChange?.(model)
  }

  const sections = [
    { label: "Featured", icon: SparkleIcon, items: featuredModels },
    { label: "All models", items: otherModels }
  ]

  return (
    <SelectorBase
      searchable
      sections={sections}
      currentValue={selectedId}
      onSelect={handleSelect}
      icon={<ModelAvatar familyId={selectedModel?.familyId} />}
      triggerValue={loading ? "Loading..." : selectedModel?.name}
      contentClassName="min-w-[340px]"
    />
  )
}