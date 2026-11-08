"use client";

import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

/**
 * CharacterTabSwitch
 * Floating bottom pills to switch between "Body Sheet" and "More Details"
 * with thumbnail image indicators in Google Flow style.
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
    <div className="flex gap-2.5 justify-center items-center pt-3">
      {/* Button 1: Body Sheet */}
      <Button
        type="button"
        variant="ghost"
        className="h-8 px-2.5 bg-white/5 border-none text-on-surface-variant hover:text-on-surface hover:bg-white/10 text-xs"
        onClick={() => setActiveTab("sheet")}
        aria-label="Body Sheet"
      >
        <div
          className={`size-8 rounded-md overflow-hidden shrink-0 flex items-center justify-center ${
            activeTab === "sheet" ? "bg-white text-black" : "bg-surface-elevated text-on-surface"
          }`}
        >
          {activeSheetSrc && !imageLoadError ? (
            <img
              src={activeSheetSrc}
              alt="Body Sheet"
              onError={() => setImageLoadError && setImageLoadError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <GoogleIcon
              iconName="portrait"
              className={`text-lg ${activeTab === "sheet" ? "text-black" : "text-on-surface"}`}
            />
          )}
        </div>
        <span className="font-medium pr-1">Body Sheet</span>
      </Button>

      {/* Button 2: More Details */}
      <Button
        type="button"
        variant="ghost"
        className="h-8 px-2.5 bg-white/5 border-none text-on-surface-variant hover:text-on-surface hover:bg-white/10 text-xs"
        onClick={() => setActiveTab("details")}
        aria-label="More Details"
      >
        <div
          className={`size-8 rounded-md overflow-hidden shrink-0 flex items-center justify-center ${
            activeTab === "details" ? "bg-white text-black" : "bg-surface-elevated text-on-surface"
          }`}
        >
          {firstDetailPhotoSrc ? (
            <img
              src={firstDetailPhotoSrc}
              alt="More Details"
              className="w-full h-full object-cover"
            />
          ) : (
            <GoogleIcon iconName="accessibility_new" className="text-lg" />
          )}
        </div>
        <span className="font-medium pr-1">More Details</span>
      </Button>
    </div>
  );
}

export default CharacterTabSwitch;
