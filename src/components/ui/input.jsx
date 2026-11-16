"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Input = React.forwardRef(({
  className,
  type = "text",
  placeholder,
  value,
  onChange,
  ...props
}, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn(
        "flex h-9.5 w-full rounded-[10px] border border-[#27272A] bg-white/5 px-3.5 text-white placeholder:text-white/50 hover:border-white/20 focus:border-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans antialiased shadow-none cursor-text text-sm",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
