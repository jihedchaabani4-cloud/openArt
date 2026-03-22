import { PromptBar } from "./PromptBar";

export function ImagePromptBar({ hideBackground = false, isNewProject = false }) {
    return <PromptBar hideBackground={hideBackground} isNewProject={isNewProject} initialMode="image" />;
}
