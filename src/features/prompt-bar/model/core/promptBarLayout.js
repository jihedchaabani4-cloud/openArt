const BASE_CARD_CLASS =
  "relative w-full flex flex-col bg-(--background-base-pri) backdrop-blur-[80px] rounded-[28px] min-h-[60px]";

export const PROMPT_BAR_VARIANTS = {
  generation: {
    cardClassName: `${BASE_CARD_CLASS} border border-white/5`,
    innerClassName: "w-full flex flex-col",
  },
  edit: {
    cardClassName: BASE_CARD_CLASS,
    innerClassName: "w-full flex flex-col",
  },
  elements: {
    cardClassName: `${BASE_CARD_CLASS} overflow-hidden`,
    innerClassName: "w-full flex flex-col",
  },
};

export function getPromptBarVariant(variant = "generation") {
  return PROMPT_BAR_VARIANTS[variant] || PROMPT_BAR_VARIANTS.generation;
}

export function getPromptBarContainerClassName(hideBackground = false) {
  return hideBackground
    ? "relative w-full flex flex-col"
    : "fixed bottom-8 left-1/2 -translate-x-1/2 w-full z-50 flex items-center justify-center max-w-[650px] px-6";
}

export function getPromptBarContentClassName() {
  return "w-full flex flex-col items-end justify-end";
}

