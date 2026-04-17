import React from 'react';
import { Paperclip, UserCircle, Mountain, Sparkles, Package } from 'lucide-react';
import { ActionButton } from '../common/ActionButton';
import { useElementStore } from '../../model/useElementStore';
import { BaseSelect, useSelectLogic } from '../common/selectors/DropdownEngine';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
export function ElementsRow2({ paramsProps, actionProps, onToggleVariations, variationsOpen, onAddClick, mediaOpen, paperclipRef }) {
  const { elementMode, setElementMode, featureEditorOpen, setFeatureEditorOpen, sparklesRef } = paramsProps;

  const { open, panelStyle, triggerRef, panelRef, handleToggle, handleSelect } = useSelectLogic(
    elementMode,
    setElementMode
  );

  const groups = [
    {
      label: "Element Type",
      items: [
        { label: "Character", value: "character" },
        { label: "Location", value: "location" },
        { label: "Product", value: "product" },
      ]
    }
  ];

  const currentItem = groups[0].items.find(i => i.value === elementMode);

  return (
    <div className="flex items-center justify-between gap-1.5 w-full relative">
      
      {/* ── LEFT SIDE ── */}
      <div className="flex items-center gap-1.5">
        <Button
            ref={paperclipRef}
            onClick={onAddClick}
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-lg transition-colors shrink-0 w-9 h-9",
               mediaOpen ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100'
            )}
            title="Add Reference Images"
            type="button"
          >
            <Paperclip className="w-4 h-4" />
        </Button>

        <div className="flex justify-center group/select px-2">
            <BaseSelect 
              value={elementMode}
              displayLabel={currentItem?.label || "Select Type"}
              groups={groups}
              open={open}
              panelStyle={panelStyle}
              triggerRef={triggerRef}
              panelRef={panelRef}
              handleToggle={handleToggle}
              handleSelect={handleSelect}
            />
        </div>
      </div>

      {/* ── RIGHT SIDE ── */}
      <div className="flex items-center gap-2 shrink-0">
        {elementMode === 'character' && (
            <Button
              ref={sparklesRef}
              onClick={() => setFeatureEditorOpen(!featureEditorOpen)}
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-lg transition-all shrink-0 group w-9 h-9 relative overflow-hidden",
                featureEditorOpen 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
              )}
              title="Feature Editor"
              type="button"
            >
              <Sparkles className={cn("w-4 h-4 transition-transform", featureEditorOpen && "scale-110")} />
              {!featureEditorOpen && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}
            </Button>
        )}

        <ActionButton {...actionProps} />
      </div>

    </div>
  );
}
