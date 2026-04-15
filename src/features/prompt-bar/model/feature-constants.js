
export const TABS = [
  { value: 'identity', label: 'Identity'},
  { value: 'appearance', label: 'Physical Traits'},
  { value: 'details', label: 'Details'},
  { value: 'outfit', label: 'Outfit'},
];

export const IDENTITY_SUB_TABS = [
  { id: 'gender', label: 'Gender' },
  { id: 'race', label: 'Race' },
  { id: 'age', label: 'Age' },
];

export const APPEARANCE_SUB_TABS = [
  { id: 'build', label: 'Build' },
  { id: 'height', label: 'Height' },
  { id: 'eyeColor', label: 'Eye Color' },
  { id: 'hairStyle', label: 'Hair Style' },
  { id: 'hairTexture', label: 'Hair Texture' },
  { id: 'hairColor', label: 'Hair Color' },
  { id: 'facialHair', label: 'Facial Hair' },
];

export const IDENTITY_OPTIONS = {
  gender: [
    { value: 'male', label: 'Male', mediaLink: 'C:/Users/jihad/.gemini/antigravity/brain/9501260c-da82-438a-ac72-11b9b5aa01d5/male_portrait_id_1776168374740.png' },
    { value: 'female', label: 'Female', mediaLink: 'C:/Users/jihad/.gemini/antigravity/brain/9501260c-da82-438a-ac72-11b9b5aa01d5/female_portrait_id_1776168401422.png' },
  ],
  race: [
    { value: 'caucasian', label: 'Caucasian', mediaLink: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop' },
    { value: 'asian', label: 'Asian', mediaLink: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
    { value: 'black', label: 'Black', mediaLink: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=200&h=200&fit=crop' },
    { value: 'hispanic', label: 'Hispanic', mediaLink: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop' },
  ],
};

export const AGE_STEPS = [
  { label: "18yo", value: "18" },
  { label: "20yo", value: "20" },
  { label: "25yo", value: "25" },
  { label: "30yo", value: "30" },
  { label: "35yo", value: "35" },
  { label: "40yo", value: "40" },
  { label: "45yo", value: "45" },
  { label: "50yo", value: "50" },
  { label: "55yo", value: "55" },
  { label: "60yo", value: "60" },
  { label: "70yo", value: "70" },
];

export const HEIGHT_STEPS = [
  { label: "Very short", value: "very-short" },
  { label: "Short", value: "short" },
  { label: "Average", value: "average" },
  { label: "Tall", value: "tall" },
  { label: "Very tall", value: "very-tall" },
];

export const APPEARANCE_OPTIONS = {
  build: [
    { value: 'slim', label: 'Slim' },
    { value: 'athletic', label: 'Athletic' },
    { value: 'muscular', label: 'Muscular' },
    { value: 'heavy', label: 'Heavy' },
    { value: 'average', label: 'Average' },
  ],
  height: [], 
  eyeColor: [
    { value: 'brown', label: 'Brown' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'hazel', label: 'Hazel' },
    { value: 'grey', label: 'Grey' },
    { value: 'amber', label: 'Amber' },
  ],
  hairStyle: [
    { value: 'short', label: 'Short' },
    { value: 'long', label: 'Long' },
    { value: 'bald', label: 'Bald' },
    { value: 'buzzcut', label: 'Buzzcut' },
    { value: 'bob', label: 'Bob' },
    { value: 'pixie', label: 'Pixie' },
    { value: 'ponytail', label: 'Ponytail' },
  ],
  hairTexture: [
    { value: 'straight', label: 'Straight' },
    { value: 'wavy', label: 'Wavy' },
    { value: 'curly', label: 'Curly' },
    { value: 'coily', label: 'Coily' },
  ],
  hairColor: [
    { value: 'black', label: 'Black' },
    { value: 'brown', label: 'Brown' },
    { value: 'blonde', label: 'Blonde' },
    { value: 'red', label: 'Red' },
    { value: 'grey', label: 'Grey' },
    { value: 'white', label: 'White' },
  ],
  facialHair: [
    { value: 'clean', label: 'Clean Shaven' },
    { value: 'stubble', label: 'Stubble' },
    { value: 'fullBeard', label: 'Full Beard' },
    { value: 'goatee', label: 'Goatee' },
    { value: 'mustache', label: 'Mustache' },
  ],
};

export const OUTFIT_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'high-fashion', label: 'High Fashion' },
  { value: 'military', label: 'Military' },
  { value: 'sporty', label: 'Sporty' },
  { value: 'workwear', label: 'Workwear' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'punk', label: 'Punk' },
];

/**
 * Helper to get information about a feature value
 */
export function getFeatureInfo(section, key, value) {
  if (!value) return null;

  if (section === 'outfit') {
    return OUTFIT_OPTIONS.find(opt => opt.value === value) || { label: value };
  }

  if (section === 'identity') {
    if (key === 'age') return AGE_STEPS.find(opt => opt.value === value) || { label: value };
    return IDENTITY_OPTIONS[key]?.find(opt => opt.value === value) || { label: value };
  }

  if (section === 'appearance') {
    if (key === 'height') return HEIGHT_STEPS.find(opt => opt.value === value) || { label: value };
    return APPEARANCE_OPTIONS[key]?.find(opt => opt.value === value) || { label: value };
  }

  return { label: value };
}

/**
 * Reverse lookup to reconstruct a feature's full context (section, key, value) just from its label/value string
 */
export function getFeatureInfoFromLabel(labelOrValue) {
  if (!labelOrValue) return null;
  const target = labelOrValue.trim().toLowerCase();

  // Check Outfit
  const outfitMatch = OUTFIT_OPTIONS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (outfitMatch) return { section: 'outfit', key: null, value: outfitMatch.value, label: outfitMatch.label };

  // Check Identity
  for (const [key, options] of Object.entries(IDENTITY_OPTIONS)) {
    const match = options.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
    if (match) return { section: 'identity', key, value: match.value, label: match.label, mediaLink: match.mediaLink };
  }
  const ageMatch = AGE_STEPS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (ageMatch) return { section: 'identity', key: 'age', value: ageMatch.value, label: ageMatch.label };

  // Check Appearance
  for (const [key, options] of Object.entries(APPEARANCE_OPTIONS)) {
    const match = options.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
    if (match) return { section: 'appearance', key, value: match.value, label: match.label };
  }
  const heightMatch = HEIGHT_STEPS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (heightMatch) return { section: 'appearance', key: 'height', value: heightMatch.value, label: heightMatch.label };

  return null;
}
