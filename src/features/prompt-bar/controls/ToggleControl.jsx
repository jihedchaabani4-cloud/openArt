"use client";

import React from "react";
import { BaseSelector } from "./BaseSelector.jsx";

const TOGGLE_OPTIONS = [
  { value: false, label: "Off" },
  { value: true, label: "On" },
];

/**
 * ToggleControl
 * Prompt Bar Platform — Boolean parameter control.
 *
 * Uses the generic BaseSelector:
 * - Options: Off / On
 * - Label: parameter name
 */
export const ToggleControl = React.memo(function ToggleControl({
  definition,
  value,
  onChange,
  error,
  disabled = false,
}) {
  return (
    <BaseSelector
      label={definition?.label}
      value={Boolean(value)}
      onChange={onChange}
      options={TOGGLE_OPTIONS}
      disabled={disabled}
      error={error}
    />
  );
});
