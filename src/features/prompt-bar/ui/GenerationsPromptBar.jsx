import { PromptBar } from "./PromptBar";

export function GenerationsPromptBar({ hideBackground = false, isNewProject = false }) {
    return <PromptBar hideBackground={hideBackground} isNewProject={isNewProject} initialMode="cinema" />;
}
