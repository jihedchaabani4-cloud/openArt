"use client";
import { ProjectError } from "@/shared/ui/ProjectError";

export default function ErrorBoundary({ error, reset }) {
  return <ProjectError error={error} reset={reset} onRetry={reset} />;
}
