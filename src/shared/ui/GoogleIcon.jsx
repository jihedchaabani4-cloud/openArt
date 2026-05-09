import React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * GoogleIcon component for Material Symbols Outlined
 * @param {string} iconName - The name of the icon (snake_case usually)
 * @param {string} className - Additional classes for styling
 * @param {boolean} fill - Whether the icon should be filled
 * @param {number} weight - Font weight (100-700)
 * @param {number} grade - Grade (-25-200)
 * @param {number} opticalSize - Optical size (20-48)
 */
export const GoogleIcon = ({ 
    iconName, 
    className, 
    fill = false, 
    weight = 400, 
    grade = 0, 
    opticalSize = 20 
}) => {
    return (
        <span 
            className={cn("material-symbols-outlined select-none text-[12px]", className)}
            style={{
                fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`
            }}
        >
            {iconName}
        </span>
    );
};
