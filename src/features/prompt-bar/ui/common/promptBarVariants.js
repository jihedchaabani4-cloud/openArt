export const PROMPT_BAR_VARIANTS = {
  generation: {
    cardClassName:
      "relative w-full flex flex-col border border-white/5 shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.4)] bg-(--color-imagine-grey-2) backdrop-blur-[80px] rounded-2xl min-h-[60px]",
    innerClassName: "w-full flex flex-col",
  },
  elements: {
    cardClassName:
      "relative w-full flex flex-col shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.4)] backdrop-blur-[80px] bg-(--color-imagine-grey-2) rounded-2xl overflow-hidden min-h-[60px]",
    innerClassName: "w-full flex flex-col",
  },
};

export function getPromptBarVariant(variant = "generation") {
  return PROMPT_BAR_VARIANTS[variant] || PROMPT_BAR_VARIANTS.generation;
}
