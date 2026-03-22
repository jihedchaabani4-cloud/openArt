import React from 'react';
import { PromptTextarea } from './PromptTextarea';
import { ParamsBar } from './ParamsBar';
import { ActionButton } from './ActionButton';

export function Row2({ promptProps, paramsProps, actionProps }) {
  return (
    <div className="flex flex-col w-full p-4 gap-3">
      <div className="flex gap-2.5 items-start">
        <PromptTextarea 
          {...promptProps} 
          referenceImages={promptProps.referenceImages} 
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <ParamsBar 
          {...paramsProps} 
          generationMode={promptProps.modeProps.value}
          setGenerationMode={promptProps.modeProps.onChange}
        />
        <div className="ml-auto flex items-center gap-2">
          <ActionButton {...actionProps} />
        </div>
      </div>
    </div>
  );
}
