"use client";

import React, { useMemo } from "react";
import { resolveControl } from "./controlRegistry";
import { cn } from "@/shared/lib/utils";

/**
 * DynamicParameterRenderer
 * 
 * Deterministically renders UI controls for any active model parameters.
 * Contains ZERO model-specific branching.
 */
export const DynamicParameterRenderer = React.memo(function DynamicParameterRenderer({
  definitions = {},
  values = {},
  onChange,
  errors = {},
  groupFilter,
  className,
}) {
  // Deterministic parameter sorting by order, then alphabetical
  const sortedParams = useMemo(() => {
    return Object.entries(definitions)
      .filter(([, def]) => !groupFilter || def.group === groupFilter)
      .sort(([, a], [, b]) => {
        const orderA = a.order ?? 100;
        const orderB = b.order ?? 100;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [definitions, groupFilter]);

  if (sortedParams.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {sortedParams.map(([name, def]) => {
        const ControlComponent = resolveControl(def.type);
        const currentValue = values[name];
        const error = errors[name];

        return (
          <ControlComponent
            key={name}
            definition={def}
            value={currentValue}
            onChange={(nextVal) => onChange(name, nextVal)}
            error={error}
          />
        );
      })}
    </div>
  );
});
