"use client";

import * as React from "react";
import { Input } from "@/shared/ui/input";

/**
 * NavbarInput
 * Seamless inline input for editing titles, names, and identifiers in the navbar,
 * strictly powered by the shared unified Input component.
 *
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Receives event
 * @param {string} [props.placeholder="Untitled"]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.autoFocus=false]
 * @param {string} [props.className]
 */
export const NavbarInput = React.forwardRef(function NavbarInput(
  {
    value = "",
    onChange,
    placeholder = "Untitled",
    disabled = false,
    autoFocus = false,
    className,
    ...rest
  },
  ref
) {
  return (
    <Input
      ref={ref}
      variant="navbar"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={className}
      {...rest}
    />
  );
});

export default NavbarInput;
