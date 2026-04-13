// Spring config — tuned for 120Hz feel
export const SPRING = {
    type: "spring",
    stiffness: 600,
    damping: 32,
    mass: 0.6,
};

// Faster spring for opacity/scale micro-animations
export const SPRING_FAST = {
    type: "spring",
    stiffness: 600,
    damping: 36,
    mass: 0.4,
};
