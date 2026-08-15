export const ctiLogo = require('./cti_logo.png');
export const authBg = require('./auth_bg.png');

// Animated version of the logo — splash screen only, everywhere else keeps
// the static ctiLogo above.
export const lottieCtiLogo = require('./lottie-cti-logo.json');

// One product photo reused everywhere a demo product needs an image —
// swap for the real per-product photo once the API sends one.
export const demoProductPhoto = require('./products/phone-1.png');

// One full splash per theme — the logo is already part of these images.
export const splashByTheme = {
  white: require('./splash/white.png'),
  black: require('./splash/black.png'),
  sand: require('./splash/sand.png'),
  ocean: require('./splash/ocean.png'),
  forest: require('./splash/forest.png'),
};
