import React from "react";
import { Button } from "@/components/ui/button";
import { Cuboid } from "lucide-react";
import { cn } from "@/lib/utils";

export function ManageElementsButton({ 
  showElementsDialog, 
  setShowElementsDialog 
}) {
  return (
    <Button
      type="button" 
      variant="ghost" 
      size="icon"
      onClick={() => setShowElementsDialog(!showElementsDialog)}
      className={cn(
        "w-14 h-14 rounded-md border transition-all duration-200 shrink-0",
        showElementsDialog ? "border-[#D4FF00]/40 bg-[#D4FF00]/10 text-[#D4FF00]" : "bg-white/5 border-white/10 text-white"
      )}
      title="Manage Elements (@)"
    >
      <Cuboid size={19} />
    </Button>
  );
}
