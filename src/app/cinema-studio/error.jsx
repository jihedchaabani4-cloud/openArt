"use client";
import { ProjectError } from "@/features/projects/ui/ProjectError";

export default function ErrorBoundary({ error, reset }) {
  return <ProjectError error={error} reset={reset} onRetry={reset} />;
}
