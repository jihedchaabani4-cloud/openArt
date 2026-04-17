// ==========================================
// 1. MAIN TABS (El Menu lkbir)
// ==========================================
export const TABS = [
  { value: 'era', label: 'Era' },
  { value: 'renderingStyle', label: 'Rendering Style' },
  { value: 'identity', label: 'Base & Identity' },
  { value: 'head', label: 'Head & Face' },
  { value: 'details', label: 'Details & Markings' },
  { value: 'outfit', label: 'Outfit & Style' },
];

// ==========================================
// 2. SUB-TABS (El menu sghir ta7t kol tab)
// ==========================================
export const IDENTITY_SUB_TABS = [
  { id: 'characterType', label: 'Type' },
  { id: 'gender', label: 'Gender' },
  { id: 'race', label: 'Race' },
  { id: 'age', label: 'Age' },
  { id: 'build', label: 'Body Build' },
  { id: 'height', label: 'Height' },
];

export const HEAD_SUB_TABS = [
  { id: 'hairStyle', label: 'Hair Style' },
  { id: 'hairTexture', label: 'Hair Texture' },
  { id: 'hairColor', label: 'Hair Color' },
];

export const DETAILS_SUB_TABS = [
  { id: 'eyeColor', label: 'Eye Color' },
  { id: 'skinCondition', label: 'Skin Features' },
  { id: 'rightArm', label: 'Right Arm' },
  { id: 'leftArm', label: 'Left Arm' },
  { id: 'rightLeg', label: 'Right Leg' },
  { id: 'leftLeg', label: 'Left Leg' },
];

// ==========================================
// 3. STEPS (Sliders / Steps lil Age w Height w Era)
// ==========================================
export const ERA_STEPS = [
  { label: "1900s", value: "1900s" }, { label: "1910s", value: "1910s" },
  { label: "1920s", value: "1920s" }, { label: "1930s", value: "1930s" },
  { label: "1940s", value: "1940s" }, { label: "1950s", value: "1950s" },
  { label: "1960s", value: "1960s" }, { label: "1970s", value: "1970s" },
  { label: "1980s", value: "1980s" }, { label: "1990s", value: "1990s" },
  { label: "2000s", value: "2000s" }, { label: "2010s", value: "2010s" },
  { label: "2020s", value: "2020s" },
];

export const AGE_STEPS = [
  { label: "18yo", value: "18" }, { label: "20yo", value: "20" },
  { label: "25yo", value: "25" }, { label: "30yo", value: "30" },
  { label: "35yo", value: "35" }, { label: "40yo", value: "40" },
  { label: "45yo", value: "45" }, { label: "50yo", value: "50" },
  { label: "55yo", value: "55" }, { label: "60yo", value: "60" },
  { label: "70yo", value: "70" },
];

export const HEIGHT_STEPS = [
  { label: "Very short", value: "very-short" },
  { label: "Short build", value: "short" },
  { label: "Average height", value: "average" },
  { label: "Tall", value: "tall" },
  { label: "Very tall", value: "very-tall" },
];

// ==========================================
// 4. OPTIONS (El Data)
// ==========================================
export const CHARACTER_TYPE_OPTIONS = [
  { value: 'human',     label: 'Human',     mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875386/Human_hhnwdj.webp' },
  { value: 'ant',       label: 'Ant',       mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875384/Ant_tcxyaf.webp' },
  { value: 'bee',       label: 'Bee',       mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875385/Bee_w4mup1.webp' },
  { value: 'octopus',   label: 'Octopus',   mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875388/Octopus_e72hsw.webp' },
  { value: 'crocodile', label: 'Crocodile', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875385/Crocodile_dxjgjv.webp' },
  { value: 'iguana',    label: 'Iguana',    mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875387/Iguana_aqirdc.webp' },
  { value: 'lizard',    label: 'Lizard',    mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875388/Lizard_hm6wjf.webp' },
  { value: 'alien',     label: 'Alien',     mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875383/Alien_f0bvq9.webp' },
  { value: 'beetle',    label: 'Beetle',    mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875385/Beetle_uanyia.webp' },
  { value: 'reptile',   label: 'Reptile',   mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875389/Reptile_lg9gwl.webp' },
  { value: 'amphibian', label: 'Amphibian', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875383/Amphibian_pza6ix.webp' },
  { value: 'elf',       label: 'Elf',       mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875386/Elf_pefqzq.webp' },
  { value: 'mantis',    label: 'Mantis',    mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875388/Mantis_ztfim8.webp' },
];

export const IDENTITY_OPTIONS = {
  gender: [
    { value: 'male', label: 'Male', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875415/Male_ahweo2.webp' },
    { value: 'female', label: 'Female', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869315/Female_ihr6om.webp' },
  ],
  race: [
    { 
      value: 'african', 
      label: 'African', 
      mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776338659/Gemini_Generated_Image_ly1uc9ly1uc9ly1u-Picsart-AiImageEnhancer_uwwgdl.png', 
      mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869291/African_erzl3h.webp' 
    },
    { 
      value: 'asian', 
      label: 'Asian', 
      mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776338662/asianMAn_fthkme.png', // TODO: Replace with Cloudinary link for Asian_man
      mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869291/Asian_afmzrt.webp' 
    },
    { 
      value: 'european', 
      label: 'European', 
      mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776338657/eropien-Picsart-AiImageEnhancer_cwqcaa.png', // TODO: Replace with Cloudinary link for European_man
      mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869293/European_tskjmt.webp' 
    },
    { 
      value: 'indian', 
      label: 'Indian', 
      mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776338658/Gemini_Generated_Image_k6r85lk6r85lk6r8-Picsart-AiImageEnhancer_dz2zki.png', // TODO: Replace with Cloudinary link for Indian_man
      mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875397/Indian_ehy1ou.webp' 
    },
    { 
      value: 'middle_eastern', 
      label: 'Middle Eastern', 
      mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776338657/qds-Picsart-AiImageEnhancer_v7x6pv.png', // TODO: Replace with Cloudinary link for Middle_Eastern_man
      mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875397/Middle_Eastern_dx4v3u.webp' 
    },
    { 
      value: 'mixed', 
      label: 'Mixed', 
      mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776338658/ffsfs_dfsdf-Picsart-AiImageEnhancer_u5tymo.png', // TODO: Replace with Cloudinary link for Mixed_man
      mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869294/Mixed_oyvgza.webp' 
    },
  ],
  build: [
    { value: 'slim', label: 'Slim', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875382/Slim_azmg34.webp' },
    { value: 'lean', label: 'Lean', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875381/Lean_c2lpwf.webp' },
    { value: 'athletic', label: 'Athletic', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875380/Athletic_nag0pk.webp' },
    { value: 'muscular', label: 'Muscular', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875381/Muscular_w1zm3n.webp' },
    { value: 'curvy', label: 'Curvy', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875381/Curvy_om9zdw.webp' },
    { value: 'heavy', label: 'Heavy', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875381/Heavy_lgmgvh.webp' },
  ],
};

export const HEAD_OPTIONS = {
  hairStyle: [
    { value: 'short', label: 'Short Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869321/Short_hair_sgqoqr.webp' },
    { value: 'long', label: 'Long Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875470/Long_hair_aoy6qr.webp' },
    { value: 'bald', label: 'Bald', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875468/Bald_ucav4u.webp' },
    { value: 'afro', label: 'Afro', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869319/Afro_cnjwwl.webp' },
    { value: 'punk', label: 'Punk Hairstyle', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875469/Punk_hairstyle_vpmv7u.webp' },
  ],
  hairTexture: [
    { value: 'straight', label: 'Straight Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776342922/straight_female_uhtvvr.jpg' },
    { value: 'wavy', label: 'Wavy Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776342923/Curly_female_ctyz9f.jpg' },
    { value: 'curly', label: 'Curly Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776342923/Curly_female_ctyz9f.jpg' },
    { value: 'coily', label: 'Coily Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776342923/Coily_female_wnvilf.jpg' },
  ],
  hairColor: [
    { value: 'black', label: 'Black Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776347985/black_jntqpn.jpg' },
    { value: 'brown', label: 'Brown Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776348136/brown_c0idw9.jpg' },
    { value: 'blonde', label: 'Blonde Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776347996/blonde_wa57di.jpg' },
    { value: 'ash-blonde', label: 'Ash Blonde Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776347981/ash_blonde_iplct7.jpg' },
    { value: 'grey', label: 'Grey Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776347980/grey_xaa5jx.jpg' },
    { value: 'white', label: 'White Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776348218/white_ym1mnt.jpg' },
    { value: 'auburn', label: 'Deep Auburn Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776347989/deep_auburn_ydqikf.jpg' },
    { value: 'ash-mauve', label: 'Dusty Ash Mauve Hair', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776347993/dusty_ash_mauve_s5pf2c.jpg' },
  ],
};

export const DETAILS_OPTIONS = {
  eyeColor: [
    { value: 'brown', label: 'Brown Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875400/Brown_f3fb8j.webp' },
    { value: 'deep-brown', label: 'Deep Brown Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875400/Deep_Brown_o1p6zy.webp' },
    { value: 'black', label: 'Black Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875400/Black_mhsqkz.webp' },
    { value: 'blue', label: 'Blue Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869298/Blue_dpjvb1.webp' },
    { value: 'green', label: 'Green Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875401/Green_h3y3s0.webp' },
    { value: 'grey', label: 'Grey Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869300/Grey_ecb6da.webp' },
    { value: 'amber', label: 'Amber Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875398/Amber_bdierh.webp' },
    { value: 'red', label: 'Red Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875401/Red_xdglwj.webp' },
    { value: 'purple', label: 'Purple Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875402/Purple_nizxfs.webp' },
    { value: 'white', label: 'White Eyes', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875403/White_kejyxc.webp' },
  ],
  skinCondition: [
    { value: 'freckles', label: 'Freckles', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875492/Freckles_p2qghz.webp' },
    { value: 'wrinkles', label: 'Wrinkled Skin', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875494/Wrinkled_skin_or88j9.webp' },
    { value: 'vitiligo', label: 'Vitiligo', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875494/Vitiligo_uhldzy.webp' },
    { value: 'albinism', label: 'Albinism', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875490/Albinism_tuxs56.webp' },
    { value: 'dry-skin', label: 'Cracked Dry Skin', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875491/Cracked_-_dry_skin_m8pubn.webp' },
    { value: 'pigmentation', label: 'Pigmentation', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875493/Pigmentation_t28qea.webp' },
    { value: 'scars', label: 'Scars', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875493/Scars_lsiy2h.webp' },
    { value: 'birthmarks', label: 'Birthmarks', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875491/Birthmarks_gyc68m.webp' },
  ],
  rightArm: [
    { value: 'none', label: 'None', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875484/None_kq4ija.webp' },
    { value: 'normal', label: 'Normal Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875485/Normal_arm_nvtpwy.webp' },
    { value: 'prosthetic', label: 'Prosthetic Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875486/Prosthetic_arm_gn4ex4.webp' },
    { value: 'robotic', label: 'Robotic Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875485/Robotic_arm_rug3no.webp' },
    { value: 'mechanical', label: 'Mechanical Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875484/Mechanical_arm_mnxiez.webp' },
    { value: 'cute', label: 'Cute Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875483/Cute_arm_s5mg9o.webp' },
  ],
  leftArm: [
    { value: 'none', label: 'None', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875474/None_bfs4xj.webp' },
    { value: 'normal', label: 'Left Normal Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875475/Normal_arm_urgqoy.webp' },
    { value: 'prosthetic', label: 'Left Prosthetic Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875475/Prosthetic_arm_t4p85s.webp' },
    { value: 'robotic', label: 'Left Robotic Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875475/Robotic_arm_jloj03.webp' },
    { value: 'mechanical', label: 'Left Mechanical Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875473/Mechanical_arm_lf4lj1.webp' },
    { value: 'cute', label: 'Left Cute Arm', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875473/Cute_arm_lphvfk.webp' },
  ],
  rightLeg: [
    { value: 'none', label: 'None', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875488/None_t5qzwe.webp' },
    { value: 'normal', label: 'Normal Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875489/Normal_leg_xgnwpm.webp' },
    { value: 'prosthetic', label: 'Prosthetic Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875489/Prosthetic_leg_uvwdge.webp' },
    { value: 'robotic', label: 'Robotic Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875489/Robotic_leg_ydhp5u.webp' },
    { value: 'mechanical', label: 'Mechanical Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875487/Mechanical_leg_bgv24w.webp' },
    { value: 'cute', label: 'Cute Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875486/Cute_leg_s3ldn4.webp' },
  ],
  leftLeg: [
    { value: 'none', label: 'None', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875477/None_w954nt.webp' },
    { value: 'normal', label: 'Left Normal Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875477/Normal_leg_rsze7i.webp' },
    { value: 'prosthetic', label: 'Left Prosthetic Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875479/Prosthetic_leg_dcn5ou.webp' },
    { value: 'robotic', label: 'Left Robotic Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875479/Robotic_leg_qlswxh.webp' },
    { value: 'mechanical', label: 'Left Mechanical Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875477/Mechanical_leg_oyargi.webp' },
    { value: 'cute', label: 'Left Cute Leg', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875476/Cute_leg_eu41uj.webp' },
  ],
};

export const OUTFIT_OPTIONS = [
  { 
    value: 'casual', 
    label: 'Casual', 
    mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391772/casuel__man_pcmh7i.jpg',
    mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391781/casuel__female_t8dw81.jpg'
  },
  { 
    value: 'formal', 
    label: 'Formal', 
    mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391772/formal_man_vjuare.jpg',
    mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391770/formal_female_za6wea.jpg'
  },
  { 
    value: 'sporty', 
    label: 'Sporty', 
    mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391772/sport_man_eby7ok.jpg',
    mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391785/sport_fmale_qvupva.jpg'
  },
  { 
    value: 'workwear', 
    label: 'Workwear', 
    mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391771/Workwear__man_e2gsaf.jpg',
    mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391774/Workwear__female_jcdwap.jpg'
  },
  { 
    value: 'vintage', 
    label: 'Vintage', 
    mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391776/Vintage__man_ulvwe0.jpg',
    mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391774/Vintage__female_eas1xo.jpg'
  },
  { 
    value: 'punk', 
    label: 'Punk', 
    mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391774/punk_female_vmvpfr.jpg',
    mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776391774/punk_female_vmvpfr.jpg'
  },
  { 
    value: 'high-fashion', 
    label: 'High Fashion', 
    mediaLinkMale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776392039/High_Fashion_man_iilhap.jpg',
    mediaLinkFemale: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1776392038/High_Fashion_male_v0htfj.jpg' 
  },
];

export const RENDERING_STYLE_OPTIONS = [
  { value: 'hyper-realistic', label: 'Hyper-realistic', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869336/Hyper-realistic_bx6cpy.webp' },
  { value: 'anime', label: 'Anime', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771875482/Anime_dtih54.webp' },
  { value: '3d-cartoon', label: '3D Cartoon', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869333/Cartoon_qofd7e.webp' },
  { value: '2d-illustration', label: '2D illustration', mediaLink: 'https://res.cloudinary.com/dsak0vfdj/image/upload/v1771869331/2D_illustration_rxbjqp.webp' },
];


// ==========================================
// 5. HELPER FUNCTIONS (Mriglin 3al Tabs ejdod)
// ==========================================

export function getFeatureInfo(section, key, value) {
  if (!value) return null;

  if (section === 'outfit') {
    return OUTFIT_OPTIONS.find(opt => opt.value === value) || { label: value };
  }
  if (section === 'renderingStyle') {
    return RENDERING_STYLE_OPTIONS.find(opt => opt.value === value) || { label: value };
  }
  if (section === 'era') {
    return ERA_STEPS.find(opt => opt.value === value) || { label: value };
  }

  if (section === 'identity') {
    if (key === 'age') return AGE_STEPS.find(opt => opt.value === value) || { label: value };
    if (key === 'height') return HEIGHT_STEPS.find(opt => opt.value === value) || { label: value };
    if (key === 'characterType') return CHARACTER_TYPE_OPTIONS.find(opt => opt.value === value) || { label: value };
    return IDENTITY_OPTIONS[key]?.find(opt => opt.value === value) || { label: value };
  }

  if (section === 'head') {
    return HEAD_OPTIONS[key]?.find(opt => opt.value === value) || { label: value };
  }

  if (section === 'details') {
    return DETAILS_OPTIONS[key]?.find(opt => opt.value === value) || { label: value };
  }

  return { label: value };
}


export function getFeatureInfoFromLabel(labelOrValue) {
  if (!labelOrValue) return null;
  const target = labelOrValue.trim().toLowerCase();

  // Check Outfit & Rendering Style
  const outfitMatch = OUTFIT_OPTIONS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (outfitMatch) return { section: 'outfit', key: null, value: outfitMatch.value, label: outfitMatch.label };
  
  const styleMatch = RENDERING_STYLE_OPTIONS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (styleMatch) return { section: 'renderingStyle', key: null, value: styleMatch.value, label: styleMatch.label };

  const eraMatch = ERA_STEPS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (eraMatch) return { section: 'era', key: null, value: eraMatch.value, label: eraMatch.label };

  // Check Identity (Gender, Race, Build, Age, Height)
  for (const [key, options] of Object.entries(IDENTITY_OPTIONS)) {
    const match = options.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
    if (match) {
      return { 
        section: 'identity', 
        key, 
        value: match.value, 
        label: match.label, 
        mediaLink: match.mediaLink || match.mediaLinkMale // fallback for race
      };
    }
  }
  const ageMatch = AGE_STEPS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (ageMatch) return { section: 'identity', key: 'age', value: ageMatch.value, label: ageMatch.label };
  
  const heightMatch = HEIGHT_STEPS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (heightMatch) return { section: 'identity', key: 'height', value: heightMatch.value, label: heightMatch.label };

  const charTypeMatch = CHARACTER_TYPE_OPTIONS.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
  if (charTypeMatch) return { section: 'identity', key: 'characterType', value: charTypeMatch.value, label: charTypeMatch.label };

  // Check Head & Face
  for (const [key, options] of Object.entries(HEAD_OPTIONS)) {
    const match = options.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
    if (match) return { section: 'head', key, value: match.value, label: match.label };
  }

  // Check Details (Eyes, Skin, Tattoos)
  for (const [key, options] of Object.entries(DETAILS_OPTIONS)) {
    const match = options.find(opt => opt.label.toLowerCase() === target || opt.value.toLowerCase() === target);
    if (match) return { section: 'details', key, value: match.value, label: match.label };
  }

  return null;
}

export function extractFeaturesFromPrompt(prompt = "") {
  const features = {
    era: null,
    renderingStyle: null,
    identity: {
      characterType: null,
      gender: null,
      race: null,
      age: null,
      build: null,
      height: null,
    },
    head: {
      hairStyle: null,
      hairTexture: null,
      hairColor: null,
    },
    details: {
      eyeColor: null,
      skinCondition: null,
      rightArm: null,
      leftArm: null,
      rightLeg: null,
      leftLeg: null,
    },
    outfit: null,
  };

  const matches = prompt.matchAll(/<Trait:\s*([^>]+)>/gi);
  for (const match of matches) {
    const info = getFeatureInfoFromLabel(match[1]);
    if (!info) continue;

    if (info.section === "era") {
      features.era = info.value;
      continue;
    }
    if (info.section === "renderingStyle") {
      features.renderingStyle = info.value;
      continue;
    }
    if (info.section === "outfit") {
      features.outfit = info.value;
      continue;
    }
    if (info.key && features[info.section]) {
      features[info.section][info.key] = info.value;
    }
  }

  return features;
}
