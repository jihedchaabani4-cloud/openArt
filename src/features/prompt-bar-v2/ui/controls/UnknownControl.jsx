"use client";

import React from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

/**
 * UnknownControl
 * Graceful fallback component when encountering an unrecognized parameter type.
 * Renders a development diagnostic warning without crashing the UI.
 */
export const UnknownControl = React.memo(function UnknownControl({
  definition,
  value,
  error,
}) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
        <GoogleIcon iconName="warning" className="text-[14px]" />
        <span>Unsupported Type: &ldquo;{definition?.type}&rdquo;</span>
      </div>
      <p className="text-[10px] text-amber-200/70">
        Parameter &ldquo;{definition?.name}&rdquo; has no registered control.
        Current value: {JSON.stringify(value)}
      </p>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
});
