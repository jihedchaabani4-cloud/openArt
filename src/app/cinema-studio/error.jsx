"use client";
import { ProjectError } from "@/components/cinema-studio/projects/ProjectError";

export default function ErrorBoundary({ error, reset }) {
  return <ProjectError error={error} reset={reset} onRetry={reset} />;
}
