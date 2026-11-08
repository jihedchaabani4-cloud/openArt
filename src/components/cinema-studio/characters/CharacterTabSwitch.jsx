"use client";

import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

/**
 * CharacterTabSwitch
 * Floating bottom pills to switch between "Body Sheet" and "More Details"
 * with thumbnail image indicators in Google Flow style.
 * Uses canonical Button variants directly without inline style overrides.
 */
export function CharacterTabSwitch({
  activeTab = "sheet",
  setActiveTab,
  activeSheetSrc,
  imageLoadError = false,
  setImageLoadError,
  firstDetailPhotoSrc,
}) {
  return (
    <div className="flex gap-2 justify-center items-center pt-3">
      {/* Button 1: Body Sheet */}
      <Button
        type="button"
        variant={activeTab === "sheet" ? "secondary" : "flow-chip"}
        onClick={() => setActiveTab("sheet")}
        aria-label="Body Sheet"
        className="gap-2"
      >
        <div className="size-6 rounded-xs overflow-hidden shrink-0 flex items-center justify-center">
          {activeSheetSrc && !imageLoadError ? (
            <img
              src={activeSheetSrc}
              alt="Body Sheet"
              onError={() => setImageLoadError && setImageLoadError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <GoogleIcon iconName="portrait" className="text-base" />
          )}
        </div>
        <span>Body Sheet</span>
      </Button>

      {/* Button 2: More Details */}
      <Button
        type="button"
        variant={activeTab === "details" ? "secondary" : "flow-chip"}
        onClick={() => setActiveTab("details")}
        aria-label="More Details"
        className="gap-2"
      >
        <div className="size-6 rounded-xs overflow-hidden shrink-0 flex items-center justify-center">
          {firstDetailPhotoSrc ? (
            <img
              src={firstDetailPhotoSrc}
              alt="More Details"
              className="w-full h-full object-cover"
            />
          ) : (
            <GoogleIcon iconName="accessibility_new" className="text-base" />
          )}
        </div>
        <span>More Details</span>
      </Button>
    </div>
  );
}

export default CharacterTabSwitch;
