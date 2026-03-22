import { ModeSelector } from "../../PromptBarComponents/ModeSelector";
import { ModelSelector } from "../../PromptBarComponents/ModelSelector";
import { QualitySelector } from "../../PromptBarComponents/QualitySelector";
import { RatioSelector } from "../../PromptBarComponents/RatioSelector";
import { VariationSelector } from "../../PromptBarComponents/VariationSelector";
import { DurationSelector } from "../../PromptBarComponents/DurationSelector";
import { VideoResolutionSelector } from "../../PromptBarComponents/VideoResolutionSelector";

export function ParamsBar({ values, onChange, generationMode, setGenerationMode }) {
  const { 
    model, 
    selectedModel, 
    studioModels, 
    studioModelsLoading, 
    resolution, 
    ratio, 
    count, 
    duration, 
    videoResolution 
  } = values;
  
  const { setModel, setResolution, setRatio, setCount, setDuration, setVideoResolution } = onChange;

  return (
    <>
      <ModeSelector value={generationMode} onChange={setGenerationMode} />
      <div className="flex-1" />
      <ModelSelector 
        type={generationMode} 
        onChange={setModel} 
        defaultId={model?.id} 
        dynamicModels={studioModels}
        loading={studioModelsLoading}
      />

      {generationMode === 'image' ? (
        <QualitySelector
          value={resolution}
          onChange={setResolution}
          options={selectedModel?.support?.quality?.options}
        />
      ) : (
        <VideoResolutionSelector
          value={videoResolution}
          onChange={setVideoResolution}
          options={selectedModel?.support?.resolution?.options}
        />
      )}

      <RatioSelector
        value={ratio}
        onChange={setRatio}
        options={selectedModel?.support?.ratio?.options}
      />

      <VariationSelector value={count} onChange={setCount} />

      {(generationMode === 'video' || generationMode === 'motion') && (
        <DurationSelector 
          value={duration} 
          onChange={setDuration} 
          options={selectedModel?.support?.duration}
        />
      )}
    </>
  );
}
