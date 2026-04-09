import { PromptEditor } from './editor/PromptEditor';

export function PromptTextarea({ value, onChange, onSubmit, textareaRef, referenceImages, className }) {
  return (
    <div className={`flex-1 flex gap-1.5 items-start w-full ${className}`}>
      <div className="flex-1 relative">
        <PromptEditor
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          textareaRef={textareaRef}
          referenceImages={referenceImages}
        />
      </div>
    </div>
  );
}