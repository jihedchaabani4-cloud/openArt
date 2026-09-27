import { SelectControl } from "./controls/SelectControl";
import { NumberControl } from "./controls/NumberControl";
import { BooleanControl } from "./controls/BooleanControl";
import { TextControl } from "./controls/TextControl";
import { ImageControl } from "./controls/ImageControl";
import { VideoControl } from "./controls/VideoControl";
import { ReferenceShelfControl } from "./controls/ReferenceShelfControl";
import { UnknownControl } from "./controls/UnknownControl";

/**
 * Static, trusted Control Registry.
 * Maps canonical parameter types to approved React components.
 */
export const CONTROL_REGISTRY = Object.freeze({
  select: SelectControl,
  number: NumberControl,
  boolean: BooleanControl,
  text: TextControl,
  image: ImageControl,
  video: VideoControl,
  "image[]": ReferenceShelfControl,
  "video[]": ReferenceShelfControl,
});

/**
 * Resolves an approved UI component for a parameter definition.
 * Falls back to UnknownControl if no component is registered.
 * 
 * @param {string} type - Parameter type
 * @returns {React.ComponentType}
 */
export function resolveControl(type) {
  if (type && type in CONTROL_REGISTRY) {
    return CONTROL_REGISTRY[type];
  }
  return UnknownControl;
}
