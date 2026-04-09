import { ModeSelector } from "../selectors/ModeSelector";
import { ModelSelector } from "../selectors/ModelSelector";
import { QualitySelector } from "../selectors/QualitySelector";
import { RatioSelector } from "../selectors/RatioSelector";
import { VariationSelector } from "../selectors/VariationSelector";
import { DurationSelector } from "../selectors/DurationSelector";
import { VideoResolutionSelector } from "../selectors/VideoResolutionSelector";

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
          options={selectedModel?.support?.quality?.options || selectedModel?.support?.quality}
        />
      ) : (selectedModel?.support?.resolution && (
        <VideoResolutionSelector
          value={videoResolution}
          onChange={setVideoResolution}
          options={selectedModel?.support?.resolution?.options || selectedModel?.support?.resolution}
        />
      ))}

      <RatioSelector
        value={ratio}
        onChange={setRatio}
        options={selectedModel?.support?.ratio?.options || selectedModel?.support?.ratio}
      />

      <VariationSelector value={count} onChange={setCount} />

      {(generationMode === 'keyframe' || generationMode === 'multiref') && (
        <DurationSelector 
          value={duration} 
          onChange={setDuration} 
          options={selectedModel?.support?.duration}
        />
      )}
    </>
  );
}
