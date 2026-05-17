export const PROMPT_BAR_VARIANTS = {
  generation: {
    cardClassName:
      "relative w-full flex flex-col border border-white/5  bg-(--background-base-pri) backdrop-blur-[80px] rounded-[28px] min-h-[60px]",
    innerClassName: "w-full flex flex-col",
  },
  elements: {
    cardClassName:
      "relative w-full flex flex-col  backdrop-blur-[80px] bg-(--background-base-pri) rounded-[28px] overflow-hidden min-h-[60px]",
    innerClassName: "w-full flex flex-col",
  },
};

export function getPromptBarVariant(variant = "generation") {
  return PROMPT_BAR_VARIANTS[variant] || PROMPT_BAR_VARIANTS.generation;
}
