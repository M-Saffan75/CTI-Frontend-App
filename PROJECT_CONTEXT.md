# CTI — Project Architecture & Decisions

React Native app, component-driven architecture. This file is the source of truth for
decisions made during planning — read this first in any new session to restore context.

## Stack
- **Platform**: React Native (bare CLI, not Expo), v0.86.2
- **Language**: TypeScript, but `strict`, `noImplicitAny`, `strictNullChecks` are OFF in
  `tsconfig.json` — write plain JS-style code, no forced type annotations. Files use
  `.tsx`/`.ts` extensions only because the JS-only community template no longer exists.
- **Location**: `D:\React-Native-works\CTI`
- **Dev target**: Android-first (physical phone via USB debugging). iOS build access will
  be arranged later via someone else's Mac — screen/component code must stay platform-agnostic,
  no iOS-specific rewrites. Any platform differences (shadow vs elevation, etc.) go in small
  shared helpers like `theme/shadow.js`, never inline in screens.
- Windows Long Path support + `git config --system core.longpaths true` already enabled
  (needed because Reanimated's native/codegen build paths are long and Windows path nesting
  can break builds).

## Scale
- Roughly 110 screens and 100+ backend APIs — but **these are ballpark figures, not fixed**.
  The real count will move up or down as the designs land. Treat "~110" as "a lot of screens,
  build for that order of magnitude", never as a number to plan exactly against.

## Roles — the top-level partition
The app serves **three roles: Customer, Seller, Repairman**. Effectively three apps in one
binary. Decisions made about them:

- **Auth is NOT shared — each role has its own auth screens.** The app opens on a
  `RoleSelectScreen` (Customer / Seller / Repairman). Each role then has its own
  login / register / verify / forgot / reset screens under `roles/<Role>/features/Auth/`.
  Because the screens are already separate, each role's `authApi.ts` simply hardcodes its
  own `role: "customer" | "seller" | "repairman"` in the request payload — no runtime
  role branching anywhere in the auth flow.
- **Everything is siloed per role — deliberately, including screens that look the same.**
  If Customer and Seller both have an "Orders" screen, they get two separate files. We do NOT
  share a screen across roles and branch on role inside it. Screens mostly differ anyway;
  the few that overlap are duplicated on purpose so one role's changes can never break another.
- **Duplication is at the screen-composition level only, never at the building-block level.**
  All roles still import the same `src/components/` (Button, Card, StatusBadge, …) and
  `src/animations/`. Do not fork those per role.
- **No in-app role switching.** A user logs out and logs back in to use a different role.
  Logout returns to `RoleSelectScreen`. This means `RootNavigator` never has to swap
  navigators live — but logout MUST clear the TanStack Query cache and the selected role,
  or the next role logs in to the previous role's stale data.
- Screen designs are supplied by the user as PNGs.

## Folder structure — role-partitioned, then feature-colocated
```
src/
  app/
    App.tsx                  <- provider wrapper (Gesture > Query > Toast > Theme > Auth > Navigation)
    providers.tsx            <- provider nesting kept out of App.tsx

  features/                  <- ROLE-AGNOSTIC. RoleSelect is the only member.
    RoleSelect/
      screens/RoleSelectScreen.tsx   <- app entry: pick Customer / Seller / Repairman

  roles/
    Customer/
      features/
        Auth/        <- this role's OWN auth screens
          screens/   (LoginScreen, RegisterScreen, VerifyEmailScreen, ForgotPasswordScreen, ResetPasswordScreen)
          components/ (OtpInput)
          api/       (authApi.ts — hardcodes role: "customer"; authQueries.ts — react-query hooks)
        Home/        screens/ components/ api/
        Orders/      ... (one folder per feature, same pattern)
      navigation/
        CustomerAuthStack.tsx
        CustomerNavigator.tsx
      routes.ts                <- this role's screen names in one place
    Seller/                    <- same shape, authApi hardcodes role: "seller"
    Repairman/                 <- same shape, authApi hardcodes role: "repairman"

  navigation/
    RootNavigator.tsx  <- no role picked -> RoleSelect
                       <- role picked, not logged in -> that role's AuthStack
                       <- logged in -> that role's Navigator
    linking.ts

  components/     <- global reusable: Button, Heading, Title, Card, StatusBadge, PasswordStrength
  animations/     <- FadeIn, FadeUp, SlideIn, SlideUp, ZoomIn, ZoomOut
  theme/          <- colors.ts, ThemeContext.tsx (light/dark/system), shadow.ts, spacing.ts, typography.ts
  context/        <- AuthContext.tsx (profile fetched once, used everywhere; supplies user.role)
  api/            <- SHARED PLUMBING ONLY: client.ts (axios instance), interceptors.ts, queryClient.ts
                     No endpoints here — those live in each feature's api/ folder.
  utils/          <- dateTime.ts (Day.js wrappers), validators.ts, storage.ts
  hooks/          <- useDebounce, useKeyboard
  constants/      <- config.ts, endpoints.ts
```

### File extension convention
Use `.ts` / `.tsx` — **not** `.js`. `tsconfig.json`'s `include` is `["**/*.ts", "**/*.tsx"]`,
so a `.js` file still bundles via Metro but falls outside TypeScript entirely (no autocomplete,
no refactor support). Code inside stays plain-JS-style — `strict` is off, no annotations forced.

### Path aliases — DONE
`@/*` maps to `src/*`. Import as `@/components/Button`, `@/theme/colors`,
`@/roles/Seller/features/Orders/...` — never `../../../../../components/Button`.

Configured in two places, and **both are required**:
- `babel.config.js` → `babel-plugin-module-resolver` (runtime resolution for Metro).
  It must stay **before** `react-native-worklets/plugin`, which has to remain last.
- `tsconfig.json` → `baseUrl: "."` + `paths: { "@/*": ["src/*"] }` (editor/tsc only).

Verified working through both `tsc --noEmit` and an actual Babel transform.
If imports break after a config edit, restart Metro with `--reset-cache` — the transform
cache holds stale resolutions.

## Key architectural decisions

| Concern | Decision |
|---|---|
| Styling | Plain StyleSheet + central `theme/colors.ts`. Screens never hardcode a hex value. |
| Theme | **5 named themes**, not light/dark/system: `white` (default), `black`, `sand`, `ocean`, `forest`. Every theme exposes the same 12 semantic names, so a screen written once works in all 5. Saved to AsyncStorage under `app.theme`, so it survives restarts. |
| Theme switch animation | Telegram-style reveal spreading from the theme icon downward. **Deferred** — decided later. When built it must live in `ThemeProvider` at app level, not inside a screen, or it cannot cover headers and tab bars. Screens need no changes for it. |
| Font | **Switzer** — Regular / Medium / Bold, via `theme/fonts.ts`. Change `FAMILY` there to swap the font app-wide. Use `fontFamily: fonts.bold`, **never** `fontWeight` — Android ignores `fontWeight` on custom fonts and silently keeps the regular file. |
| No typography/spacing files | Deliberately skipped. Font sizes and padding go directly in components. The user wants fewer moving parts they have to understand. |
| Core components | Button, Heading, Title, Card, StatusBadge, PasswordStrength — all reusable, prop-configurable (height, width, colors, etc.) |
| Button press feedback | Squeeze/scale effect on press (like WhatsApp/Meta) — Reanimated `withSpring` scale, built into the shared `Button` component, `onPressIn`/`onPressOut` |
| Animations | React Native **Reanimated** (not Moti — dropped once we found Reanimated ships built-in entrance/exit presets like `FadeInUp`, `ZoomIn`, etc). Named wrapper components per type: `FadeIn`, `FadeUp`, `SlideIn`, `SlideUp`, `ZoomIn`, `ZoomOut`, each a thin wrapper around Reanimated's `entering`/`exiting` presets with our own default duration/delay. Usage: `<FadeUp><Text>...</Text></FadeUp>`. All share no duplicated boilerplate — each just configures the underlying preset. |
| Bottom-sheet / drag-to-dismiss modals | `@gorhom/bottom-sheet` (built on Reanimated + Gesture Handler already, battle-tested gesture physics — chosen over hand-rolling drag physics ourselves). Backdrop opacity fade and content slide are independent animations (this was the specific bug being avoided — RN's built-in `Modal` incorrectly couples backdrop + content into one transform). |
| Simple center modals (no drag, e.g. alerts/confirm dialogs) | Custom-built wrapper: backdrop fade + content zoom/fade, independent Reanimated animations, RN's built-in `Modal` used only as a portal (animationType="none"). |
| Toast | `react-native-root-toast` — simple plain-text toast, works on both iOS and Android (unlike `ToastAndroid` which is Android-only) |
| Date/Time | **Day.js** — `utils/dateTime.js` exposes `formatDate`, `formatTime`, `formatDateTime`, `formatRelative`, `formatShortDate` |
| State (auth/profile) | Context API — profile fetched once, consumed across multiple screens (header, profile screen, etc.) |
| Navigation | React Navigation — default transitions mostly, custom transitions (fade/slide-up) on select screens (e.g. Auth flow, modals) |
| API layer | Axios (interceptors for auth token + 401 handling) + TanStack Query (loading/error/caching/retry) for all ~100+ endpoints |
| API file organization | Module/feature-wise, colocated with each feature (see folder structure above) — NOT one giant `services/api.js` |
| Validation | Required-field pattern — red border appears on error, clears automatically once user starts retyping |
| Password strength | Inline meter shown while typing (length, special chars, etc.), animated via the shared `Motion`/animation components |
| Status display | Reusable `StatusBadge` component for pending / accepted / rejected states, used across multiple screens |
| Chat | Will have its own `features/Chat/` (screens + api) — real-time transport (Socket.io vs Firebase, etc.) not yet decided, to be architected when work starts on it |
| Push notifications | Will have its own `features/Notifications/` (screens + api) — FCM/Notifee etc. not yet decided, to be architected when work starts on it |

## Environment (verified)
- Dev device: **Infinix X6853**, Android 15 (API 35), `arm64-v8a` — USB debugging works.
- JDK 17.0.12, Node 22.17.0, Gradle 9.3.1, Android SDK at
  `C:\Users\saffa\AppData\Local\Android\Sdk`.
- `newArchEnabled=true`, `hermesEnabled=true` in `android/gradle.properties` — both are
  hard requirements for Reanimated 4, so do not turn them off.
- Bare RN app built and ran on the physical device successfully (first Gradle build ~10 min).

## iOS status — written for it, never run on it
All screen code is platform-agnostic and the few platform-specific bits are explicit
(`Platform.OS === 'ios'` branches, or Android-only props that RN ignores on iOS:
`collapsable`, `renderToHardwareTextureAndroid`, `windowSoftInputMode`).

**But `pod install` has never been run — there is no `ios/Pods` and no `Podfile.lock`.**
Every native package (Reanimated, Worklets, Gesture Handler, Screens, safe-area-context,
bottom-sheet, root-toast, linear-gradient, AsyncStorage, view-shot, masked-view) needs
CocoaPods before iOS will build at all. First thing on a Mac:

```
cd ios && pod install
```

Fonts are already registered in `Info.plist` under `UIAppFonts` and were added to the Xcode
project by `react-native-asset` — but that step printed a warning about creating the
"Resources" group itself, so double-check the fonts are in Build Phases → Copy Bundle Resources.

Untested on iOS and worth checking first:
- `OtpInput` backspace — `onKeyPress` on an empty field behaves differently per platform.
- Keyboard handling in `AuthLayout` — iOS uses `KeyboardAvoidingView behavior="padding"` *and*
  the `keyboardWillShow` scroll; together they could over-scroll.
- The theme reveal — `captureRef` and `MaskedView` both work on iOS, but the timing of the
  two snapshots has only been tuned against Android.

## Sizing rules
No responsive-sizing package — **confirmed by the user**, even though their other project
(`D:\React-Native-works\Project-Kajnow-All\KajNow`) uses `react-native-responsive-dimensions`
everywhere. Don't reintroduce it here.
 React Native's `dp` units already normalise across pixel
densities; only screen *width* varies, and only by ~20% (360–430dp) across phones. Scaling
fonts and button heights by screen width — what `responsiveWidth()` does — makes text tiny on
small phones and oversized on tablets. Native apps don't do it.

| What | How |
|---|---|
| Cards, columns, big layout blocks | `%` or `flex` |
| Button heights, icon sizes, border radius | fixed dp |
| Font sizes | fixed dp |
| Gaps and padding | fixed dp |
| Logos, banners | `%` width + a fixed height |

**`<Image>` needs BOTH width and height.** With only one — or with `aspectRatio` — the Image
falls back to its intrinsic pixel size and blows past the screen. This actually happened: the
splash logo (968×516) rendered at 968dp on a 360dp screen, ~2.7× too wide. `aspectRatio` is the
part that fails; percentage width works fine. Other components (`View`, `Text`) are unaffected —
only `Image` has an intrinsic size.

With `resizeMode="contain"`, the image fits the box on whichever side is tighter, so a fixed
height must be generous enough never to become the constraint. Splash logo: `width: '56%'` with
`height: 140` — at the widest phone (430dp) the logo needs 128, so width always drives the size
and the logo stays 56% everywhere.

**A box wider than the image's own ratio makes it look misaligned.** `contain` centres the
image in whatever box you give it, so the leftover space splits evenly on both sides and the
image appears pushed inwards. This has now caused two bugs. The CTI logo is 968x516
(**ratio 1.876**) — a `110x38` box left 39px of slack and the logo looked shoved to the right.
Either match the ratio (`110x59`) or accept the centring deliberately.

## Gotchas hit (don't re-debug these)
- **New folders need a Metro restart with `--reset-cache`.** Windows has no watchman, and
  Metro's fallback watcher does not pick up newly created *nested directories* while it is
  running. Symptom: `tsc --noEmit` is clean but the app shows a red screen and the dev server
  returns 500 with `Unable to resolve module ../features/Home/screens/HomeScreen` for a file
  that plainly exists on disk. New *files* inside an existing folder are fine — only new
  folders trigger it. Check the real error with:
  `curl -s "http://localhost:8081/index.bundle?platform=android&dev=true" | head -c 800`
- **Metro crashes on Windows during a native build.** Its fallback watcher (no watchman on
  Windows) tries to watch CMake scratch dirs under `android/app/.cxx` that get deleted
  mid-build → `ENOENT: watch ...CMakeTmp...`. Fixed via a `resolver.blockList` regex in
  `metro.config.js` covering `android/.gradle`, `android/app/.cxx`, `android/app/build`.
- `Hard link ... failed. Doing a slower copy instead.` during CMake — harmless. Gradle cache
  is on `C:`, project on `D:`; hardlinks can't cross drives.
- Gradle build launched as a killable background process can die with exit `3221225794`
  (`0xC0000142`) mid-distribution-download. Not a compile error — just re-run.

## Installed packages
Installed together (2026-08-06), no peer conflicts, all deduped:

| Package | Version |
|---|---|
| react-native-reanimated | 4.5.3 |
| react-native-worklets | 0.11.3 |
| react-native-gesture-handler | 3.1.0 |
| react-native-screens | 4.26.2 |
| @gorhom/bottom-sheet | 5.2.14 |
| react-native-root-toast | 4.0.1 |
| @react-navigation/native | 7.3.15 |
| @react-navigation/native-stack | 7.18.7 |
| @react-navigation/bottom-tabs | 7.18.15 |
| @react-native-async-storage/async-storage | 3.1.1 |
| react-native-linear-gradient | 2.8.3 |
| dayjs | 1.11.21 |
| axios | 1.19.0 |
| @tanstack/react-query | 5.101.4 |
| babel-plugin-module-resolver (dev) | latest |

- **Reanimated 4 split worklets into its own package.** `react-native-reanimated@4` peer-requires
  `react-native-worklets@0.10.x - 0.11.x`, and the babel plugin moved:
  `babel.config.js` uses `'react-native-worklets/plugin'`, **not** the old
  `'react-native-reanimated/plugin'`. It must stay last in the plugins array.
- React Native cannot render gradients on its own — the three gradient button colours in
  `colors.ts` need `react-native-linear-gradient`.

## Disk usage — this project is heavy
`reactNativeArchitectures` is left at all four ABIs (`armeabi-v7a,arm64-v8a,x86,x86_64`) by
the user's choice, so every native library compiles four times in debug:

| | |
|---|---|
| `node_modules/react-native-reanimated` | ~4.9 GB after a build |
| `node_modules/react-native-worklets` | ~3.1 GB |
| screens + gesture-handler | ~1.8 GB |

The package sources are tiny — this is all compiled C++ under each package's
`android/build` and `android/.cxx`. **Deleting those folders is safe** and frees ~10 GB; the
next build just regenerates them (~25 min). Narrowing `reactNativeArchitectures` to
`arm64-v8a` would cut ~75% of it permanently, at the cost of emulator and 32-bit support.

Emulator system images were removed from the SDK (15.6 GB) — the user develops on a physical
Infinix X6853 and has never created an AVD. Re-download via SDK Manager if an emulator is
ever needed.

## Fonts
Switzer (Regular / Medium / Bold), OTF. The `.otf` files live in `src/assets/fonts/` — that is
the **master copy only**. React Native does not read that folder.

`react-native.config.js` points the CLI at it; `npx react-native-asset` copies the files to
where the platforms actually look:
- Android → `android/app/src/main/assets/fonts/`
- iOS → `Info.plist` → `UIAppFonts`

Both copies are committed to git, so a fresh clone works without re-running anything. Only run
`npx react-native-asset` again when adding, removing, or renaming a font — **and rebuild after**,
since fonts are baked into the APK and a Metro reload will not pick them up.

A wrong `fontFamily` string does not error — RN silently falls back to the system font. The
PostScript names were checked and match the file names exactly (`Switzer-Regular`, etc.).

## Not yet done
- `App.tsx` is a **temporary test screen** (themes, fonts, icons, gradients) — replace it with
  real navigation.
- Remaining app-level provider wiring: `GestureHandlerRootView` (needed by Gesture Handler and
  @gorhom/bottom-sheet), `QueryClientProvider`, `RootSiblingParent` (root-toast), `AuthContext`.
  `ThemeProvider` and `SafeAreaProvider` are already wired.
- No navigation built yet — `RootNavigator`, `RoleSelectScreen`, per-role stacks.
- No shared components beyond `Icon` — Button, Heading, Paragraph, Card, StatusBadge,
  PasswordStrength still to build.
- Status badge colours exist in `colors.ts` but **which colour maps to which status is still
  unconfirmed** — the names there are guesses from the Figma screen titles.
- Screen designs arrive as PNGs from Figma, role by role.
