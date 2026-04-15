import React from 'react';
import { Paperclip, UserCircle, Mountain, Sparkles, Package } from 'lucide-react';
import { ActionButton } from '../common/ActionButton';
import { useElementStore } from '../../model/useElementStore';
import { BaseSelect, useSelectLogic } from '../common/selectors/DropdownEngine';
import { cn } from '@/shared/lib/utils';
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
        { label: "Character", value: "character", icon: <UserCircle className="w-4 h-4" /> },
        { label: "Location", value: "location", icon: <Mountain className="w-4 h-4" /> },
        { label: "Product", value: "product", icon: <Package className="w-4 h-4" /> },
      ]
    }
  ];

  const currentItem = groups[0].items.find(i => i.value === elementMode);

  return (
    <div className="flex items-center gap-1.5 w-full relative">
       <button
          ref={paperclipRef}
          onClick={onAddClick}
          className={cn(
            "p-2 rounded-lg transition-colors shrink-0",
             mediaOpen ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100'
          )}
          title="Add Reference Images"
          type="button"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {elementMode === 'character' && (
          <div className="relative">
            <button
              ref={sparklesRef}
              onClick={() => setFeatureEditorOpen(!featureEditorOpen)}
              className={cn(
                "p-2 rounded-lg transition-all shrink-0 group relative overflow-hidden",
                featureEditorOpen 
                  ? "bg-[#3ce5ff33] text-[#3ce5ff] shadow-[0_0_20px_rgba(60,229,255,0.1)] border border-[#3ce5ff22]" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
              )}
              title="Feature Editor"
              type="button"
            >
              <Sparkles className={cn("w-4 h-4 transition-transform", featureEditorOpen && "scale-110")} />
              {!featureEditorOpen && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}
            </button>
          </div>
        )}

       <div className="flex-1 flex justify-center group/select px-2">
          <BaseSelect 
            value={elementMode}
            displayLabel={currentItem?.label || "Select Type"}
            triggerIcon={currentItem?.icon}
            groups={groups}
            open={open}
            panelStyle={panelStyle}
            triggerRef={triggerRef}
            panelRef={panelRef}
            handleToggle={handleToggle}
            handleSelect={handleSelect}
          />
       </div>

      <div className="flex items-center gap-2 shrink-0">
        <ActionButton {...actionProps} />
      </div>
    </div>
  );
}
