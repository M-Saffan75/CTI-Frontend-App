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

// Reusable Lottie spinner/loader matching the Next.js webapp
export const ctiLoaderAnimation = require('./cti-loader.json');

// About screen assets matching web frontend/public/assets/about/
export const aboutImages = {
  hero: require('./about/1.png'),
  passion1: require('./about/2.png'),
  passion2: require('./about/3.png'),
  water: require('./about/4.png'),
  waste: require('./about/5.png'),
  energy: require('./about/6.png'),
};

