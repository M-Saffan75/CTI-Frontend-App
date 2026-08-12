/**
 * All colours live here. Screens never write a hex value directly —
 * they read from useTheme(), so switching theme changes the whole app.
 *
 * There are 5 themes. Every theme has the SAME set of names, so a screen
 * written once works in all 5 without any change.
 */

/* The raw colours from Figma. Themes below pick from these. */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  orange: '#FEA620', // brand colour
  greyBg: '#F7F7F7', // input backgrounds
  greyText: '#00000099', // small text under a title (black at 60%)

  ink: '#101828', // near-black navy
  blue: '#448AFF',
  blueBright: '#1592FD',
  blueDeep: '#193CB8',
  purple: '#8600DB',
  rust: '#A13A22',
  greenDeep: '#016630',
  greenMint: '#00BC7D',
  greenGrass: '#00A63E',
  orangeBright: '#FF820A',
  orangeDeep: '#FF6900',
  redRose: '#EE454D',
  redBright: '#FB2C36',

  mintBg: '#E1F6EE',
  creamBg: '#FDECD9',
  butterBg: '#FFF0D3',
  blushBg: '#FDEBEC',
};

/**
 * Every theme has these names:
 *
 *   primary          main brand colour (buttons, links, active states)
 *   onPrimary        text/icon colour that sits ON a primary button
 *   background       the screen behind everything
 *   surface          cards, sheets, anything raised above the background
 *   surfaceAlt       subtle grey blocks — unselected cards, list rows
 *   text             headings and body text
 *   textMuted        small grey text under a title
 *   border           card borders, dividers
 *   inputBg          text input background
 *   error            validation errors, red borders
 *   success          success states
 *   backdrop         dark overlay behind modals
 */

// `barStyle` is the colour of the phone's own status bar text/icons, so it has to
// contrast with `background`. ThemeProvider applies it once for the whole app.

// 1. WHITE — the default. Clean white, orange brand.
const white = {
  barStyle: 'dark-content',
  primary: palette.orange,
  onPrimary: palette.ink, // dark text on orange — white fails contrast
  background: palette.white,
  surface: palette.white,
  surfaceAlt: palette.greyBg,
  text: palette.ink,
  textMuted: palette.greyText,
  border: '#0000001A',
  inputBg: palette.greyBg,
  error: palette.redBright,
  success: palette.greenGrass,
  backdrop: '#00000080',
};

// 2. BLACK — true dark.
const black = {
  barStyle: 'light-content',
  primary: palette.orange,
  onPrimary: palette.black,
  background: '#1F1400',
  surface: '#33220A',
  surfaceAlt: '#291B00',
  text: palette.white,
  textMuted: '#FFFFFF99',
  border: '#FFFFFF1F',
  inputBg: '#291B00',
  error: palette.redRose,
  success: palette.greenMint,
  backdrop: '#000000B3',
};

// 3. SAND — warm cream. Light, but softer on the eyes than pure white.
const sand = {
  barStyle: 'dark-content',
  primary: palette.orangeDeep,
  onPrimary: palette.white,
  background: '#FFFBF5',
  surface: palette.white,
  surfaceAlt: '#FDF3E7',
  text: '#3D2B1F',
  textMuted: '#3D2B1F99',
  border: '#3D2B1F1A',
  inputBg: palette.creamBg,
  error: palette.redBright,
  success: palette.greenDeep,
  backdrop: '#3D2B1F80',
};

// 4. OCEAN — deep navy, blue accent.
const ocean = {
  barStyle: 'light-content',
  primary: palette.blue,
  onPrimary: palette.white,
  background: '#0B1B3A',
  surface: '#132749',
  surfaceAlt: '#162E55',
  text: palette.white,
  textMuted: '#FFFFFF99',
  border: '#FFFFFF1A',
  inputBg: '#1B3159',
  error: palette.redRose,
  success: palette.greenMint,
  backdrop: '#04102BB3',
};

// 5. FOREST — deep green, mint accent.
const forest = {
  barStyle: 'light-content',
  primary: palette.greenMint,
  onPrimary: '#062018',
  background: '#0A1F17',
  surface: '#122C22',
  surfaceAlt: '#153327',
  text: palette.white,
  textMuted: '#FFFFFF99',
  border: '#FFFFFF1A',
  inputBg: '#173729',
  error: palette.redRose,
  success: palette.greenMint,
  backdrop: '#04120CB3',
};

export const themes = { white, black, sand, ocean, forest };

/** The names, in the order they should appear in a theme picker. */
export const themeNames = ['white', 'black', 'sand', 'ocean', 'forest'];

/**
 * Status badge colours. These stay the same in every theme on purpose —
 * "completed" should look the same green everywhere.
 *
 * Used by the repair jobs screen. The key names don't map 1:1 to the labels
 * on screen — pick by colour, not by name:
 *   booked      -> blue  "Job Posting" tag
 *   inProgress  -> purple "Direct Message" tag
 *   dispute     -> rust  "Offers_received" pill
 *   pending     -> tan   "Confirmed" pill
 *   completed   -> green "Completed" status (Reviews tab)
 */
export const badges = {
  booked: { text: palette.blue, bg: '#448AFF33' },
  dispute: { text: palette.rust, bg: '#A13A2233' },
  inProgress: { text: palette.purple, bg: '#8600DB33' },
  completed: { text: palette.greenDeep, bg: '#01663033' },
  accepted: { text: palette.greenMint, bg: '#00BC7D33' },
  pending: { text: palette.orangeBright, bg: palette.butterBg },
};

/** Gradient buttons. Needs react-native-linear-gradient to render. */
export const gradients = {
  purple: ['#C84ADF', '#B348FD'],
  teal: ['#00BC81', '#00BBA3'],
  blue: ['#1D2CB3', '#448AFF'],
};
