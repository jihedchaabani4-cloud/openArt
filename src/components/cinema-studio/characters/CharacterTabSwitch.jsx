"use client";

import { PillTabs, PillTabsList, PillTabsTrigger } from "@/components/base/pill-tabs";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";

/**
 * CharacterTabSwitch
 * Floating bottom pills to switch between "Body Sheet" and "More Details"
 * with thumbnail image indicators in Google Flow style.
 * Uses canonical PillTabs primitive directly.
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
    <PillTabs value={activeTab} onValueChange={setActiveTab} className="pt-3">
      <PillTabsList className="justify-center gap-2">
        {/* Tab 1: Body Sheet */}
        <PillTabsTrigger
          value="sheet"
          onClick={() => setActiveTab("sheet")}
          aria-label="Body Sheet"
          className="gap-2 inline-flex items-center"
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
        </PillTabsTrigger>

        {/* Tab 2: More Details */}
        <PillTabsTrigger
          value="details"
          onClick={() => setActiveTab("details")}
          aria-label="More Details"
          className="gap-2 inline-flex items-center"
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
        </PillTabsTrigger>
      </PillTabsList>
    </PillTabs>
  );
}

export default CharacterTabSwitch;
