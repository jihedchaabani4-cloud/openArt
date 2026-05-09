import React from 'react';
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from '@/shared/ui/GoogleIcon';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/shared/ui/hover-card";
import { useCreditEstimate } from "../../model/useCreditEstimate";
import { useWalletBalance } from "@/shared/api/auth";

const GenerateIcon = ({ size = 20 }) => (
  <GoogleIcon iconName="arrow_upward" className="text-[16px]" weight={400} />
);

import { useWorkflowsStore } from "@/features/workflows";
import { useProjectData } from "@/features/workflows/api/workflowsApi";

/**
 * ActionButton - Smart Generation Button
 * Handles its own credit estimation and balance validation.
 * Can be reused anywhere in the prompt bar.
 */
export function ActionButton({ 
  generating, 
  onSubmit, 
  selectedModel: propSelectedModel,
  modelId, 
  generationMode = "image", 
  duration, 
  videoResolution, 
  quality, 
  count = 1, 
  hasContent = true,
  appOverride 
}) {
  const { selectedProjectId: projectId } = useWorkflowsStore();
  const { data: projectData } = useProjectData(projectId);
  
  // Use the directly passed selectedModel first, then fall back to lookup by modelId
  const lookedUpModel = projectData?.modelConfig?.models?.find(m => m.key === modelId || m.id === modelId);
  const selectedModel = propSelectedModel || lookedUpModel;
  const isEditMode = generationMode === "edit" || generationMode === "extend";
  
  // 1. Estimate Credit Cost using Model logic
  const { credits: modelCreditCost } = useCreditEstimate({
    selectedModel:   selectedModel,
    generationMode:  generationMode,
    duration:        duration,
    videoResolution: videoResolution,
    quality:         quality,
    operation:       isEditMode ? "edit" : "generated",
    count:           count,
  });

  // 2. Resolve final cost (App Pricing overrides Model Pricing)
  let creditCost = modelCreditCost;
  if (appOverride) {
      const appPricing = projectData?.appConfig?.pricing || {};
      if (appPricing[appOverride] !== undefined) {
          creditCost = appPricing[appOverride];
      }
  }

  // 2. Check Wallet Balance
  const { data: walletBalance = 0 } = useWalletBalance();
  const isLowBalance = creditCost !== null && walletBalance < creditCost;
  


  const buttonContent = (
    <Button
      type={isLowBalance ? "button" : "submit"}
      disabled={generating}
      onClick={isLowBalance ? (e) => e.preventDefault() : undefined}
      className={cn(
        "h-8 w-8 p-0 rounded-xl border text-[14px] transition-all duration-200 flex items-center justify-center shrink-0 relative overflow-hidden group",
        generating
          ? "bg-white/5 border-white/15 text-white cursor-wait"
          : isLowBalance
            ? "bg-transparent border-none" 
            : !hasContent
              ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/8 hover:text-white/60"
              : "bg-white border-white/15 text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
      )}
      style={isLowBalance ? { 
        backgroundImage: "url('/flow_alert_sphere.svg')", 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      } : {}}
    >
      {generating ? (
        <div className="w-[16px] h-[16px] rounded-md border-[2.5px] border-white/20 border-t-white animate-spin" />
      ) : isLowBalance ? (
        <GoogleIcon iconName="info" className="text-[18px] text-black/80" />
      ) : (
        <div className="flex items-center justify-center">
           <GenerateIcon />
        </div>
      )}
    </Button>
  );

  return (
    <div className="relative flex flex-col items-end">
      {isLowBalance ? (
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger asChild>
            <div className="cursor-help">
              {buttonContent}
            </div>
          </HoverCardTrigger>
          <HoverCardContent 
            align="end" 
            sideOffset={12}
            className="w-[280px] bg-(--color-imagine-grey-2) backdrop-blur-[80px] p-3 rounded-4xl flex flex-col items-center gap-4 z-[100]"
          >
            <GoogleIcon iconName="error" className="text-red-700 text-[32px]" />
            
            <p className="text-[12px] text-white font-medium text-center leading-relaxed">
              Vous avez besoin de plus de crédits d'IA pour finaliser cette requête.
            </p>

            <div className="flex gap-2 flex-wrap max-w-fit mt-2">
              <Button 
                variant="secondary" 
                className="flex-1 bg-white/10 hover:bg-white/15 text-white border-none h-10 rounded-xl text-[12px] font-semibold"
              >
                Paramètres
              </Button>
              <Button 
                className="flex-1 bg-white hover:bg-white/90 text-black border-none h-10 rounded-xl text-[12px] font-semibold"
              >
                Changer de forfait
              </Button>
            </div>
          </HoverCardContent>
        </HoverCard>
      ) : (
        buttonContent
      )}
    </div>
  );
}
