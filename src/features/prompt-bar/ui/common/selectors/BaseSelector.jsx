"use client"

import React from "react"
import { DropdownSegmented } from "@/shared/ui/DropdownShell"

/**
 * BaseSelector
 * Standardized segmented selector for prompt bar controls.
 */
export const BaseSelector = React.memo((props) => {
  return <DropdownSegmented {...props} />;
});
