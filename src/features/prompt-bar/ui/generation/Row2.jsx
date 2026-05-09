import { GoogleIcon } from '@/shared/ui/GoogleIcon';
import { ModelSelector } from '../common/selectors/ModelSelector';
import { ActionButton } from '../common/ActionButton';

export function Row2({ paramsProps, actionProps, onToggleVariations, variationsOpen, onAddClick, mediaOpen, paperclipRef, showPaperclip = true }) {
  const {
    model,
    studioModels,
    studioModelsLoading,
    setModel,
    generationMode,
    setGenerationMode,
  } = paramsProps;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {showPaperclip && (
        <button
          ref={paperclipRef}
          onClick={onAddClick}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            mediaOpen ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100'
          }`}
          title="Add Reference Images"
          type="button"
        >
          <GoogleIcon iconName="attachment" className="text-[13px] rotate-[-45deg]" />
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <ModelSelector
          type={generationMode}
          onChange={setModel}
          defaultId={model?.id}
          dynamicModels={studioModels}
          loading={studioModelsLoading}
        />
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleVariations(); }}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            variationsOpen ? 'bg-white/10 text-white' : 'text-white/90 hover:bg-white/5 hover:text-neutral-100'
          }`}
          title="Generation Settings"
          type="button"
        >
          <GoogleIcon iconName="tune" className="text-[13px]" /> 
        </button>
        <ActionButton {...actionProps} />
      </div>
    </div>
  );
}
