import React from 'react';
import { PromptTextarea } from './PromptTextarea';
import { ParamsBar } from './ParamsBar';
import { ActionButton } from './ActionButton';

export function Row2({ paramsProps, actionProps, generationMode, setGenerationMode }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <ParamsBar 
        {...paramsProps} 
        generationMode={generationMode}
        setGenerationMode={setGenerationMode}
      />
      <div className="ml-auto flex items-center gap-2">
        <ActionButton {...actionProps} />
      </div>
    </div>
  );
}
