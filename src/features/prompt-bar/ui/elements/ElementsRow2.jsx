import React from 'react';
import { Paperclip, UserCircle } from 'lucide-react';
import { ActionButton } from '../common/ActionButton';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

export function ElementsRow2({ paramsProps, actionProps, onAddClick, mediaOpen, paperclipRef, showPaperclip = true }) {
  const { featureEditorOpen, setFeatureEditorOpen, sparklesRef } = paramsProps;

  return (
    <div className="flex items-center justify-between gap-1 w-full relative">
      
      {/* ── LEFT SIDE ── */}
      <div className="flex items-center gap-1.5">
        {showPaperclip && (
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
        )}

        {/* BaseSelect dropdown removed as requested */}
      </div>

      {/* ── RIGHT SIDE ── */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          ref={sparklesRef}
          onClick={() => setFeatureEditorOpen(!featureEditorOpen)}
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-lg transition-all shrink-0 gap-1.5 h-8 px-2.5 text-xs font-medium relative overflow-hidden",
            featureEditorOpen 
              ? "bg-white/10 text-white" 
              : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
          )}
          title="Character Form Features"
          type="button"
        >
          <UserCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Form</span>
        </Button>

        <ActionButton {...actionProps} />
      </div>

    </div>
  );
}
