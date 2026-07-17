# Build Log — Steps 1–3

Companion to [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md). Records exactly what was run, what broke, and how each issue was fixed, so the next session (or a teammate) doesn't have to rediscover any of this.

---

## Environment note (applies to all steps)

This shell's default `PATH` does not include Homebrew's bin directory, so `node`/`npm` are not found by default:

```
which node   # not found
which npm    # not found
ls -d /opt/homebrew/bin/node   # exists
```

**Fix**: every command below was run with Homebrew's bin directory prepended for that command only:

```bash
export PATH="/opt/homebrew/bin:$PATH"
```

This was not written into any persistent shell profile — it's exported per-command/per-session only.

---

## Step 1 — Install dependencies + wire Babel plugin + pod install

### 1. Installed the core JS dependencies

```bash
npm install @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-mmkv zustand \
  react-native-reanimated react-native-gesture-handler \
  react-i18next i18next
```
Result: 38 packages added, no errors.

### 2. Wired the Reanimated Babel plugin

Edited [babel.config.js](../babel.config.js):
```diff
 module.exports = {
   presets: ['module:@react-native/babel-preset'],
+  plugins: ['react-native-reanimated/plugin'],
 };
```

### 3. Ran `pod install` for iOS — hit four separate errors in sequence

**Error A — locale/encoding crash**
```
bundle exec pod install
→ Encoding::CompatibilityError: Unicode Normalization not appropriate for ASCII-8BIT
```
Cause: the shell's `LANG` isn't set to a UTF-8 locale, and CocoaPods' path-normalization code requires one.
Fix: set the locale for that command only (not persisted):
```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bundle exec pod install
```

**Error B — `node` not found inside the Podfile**
```
[!] Invalid `Podfile` file: [!] Unable to locate the executable `node`.
```
Cause: same PATH issue as the environment note above — the Podfile shells out to `node` to resolve `react_native_pods.rb`.
Fix: combined with Error A's fix — `export PATH="/opt/homebrew/bin:$PATH"` alongside the `LANG`/`LC_ALL` vars.

**Error C — missing `RNWorklets` podspec**
```
[!] Unable to find a specification for `RNWorklets` depended upon by `RNReanimated`
```
Cause: **react-native-reanimated 4.x split its JS-thread runtime out into a separate package, `react-native-worklets`**, which is a required peer dependency but is not auto-installed by npm. The installed Reanimated version was 4.5.2, which requires `react-native-worklets: 0.10.x - 0.11.x`.
Fix:
```bash
npm install react-native-worklets@0.11.0
```
Verified `babel.config.js` didn't need a separate entry — `react-native-reanimated/plugin` re-exports `react-native-worklets/plugin` internally, confirmed by reading `node_modules/react-native-reanimated/plugin/index.js`.

**Error D — missing `NitroModules` podspec**
```
[!] Unable to find a specification for `NitroModules` depended upon by `NitroMmkv`
```
Cause: `react-native-mmkv` is now built on the **Nitro Modules** native-module framework and requires `react-native-nitro-modules` as a peer dependency; it's listed only as a devDependency inside mmkv's own `package.json`, not auto-installed.
Fix:
```bash
npm install react-native-nitro-modules@0.35.9
```

**Result after all four fixes**: `pod install` completed — *"83 dependencies from the Podfile and 83 total pods installed."*

**Known environment limitation (not fixed, just documented)**: `pod install` output also showed:
```
xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance
```
Only Xcode Command Line Tools are installed on this machine, not full Xcode — pod install still succeeds, but you cannot actually build/run on iOS Simulator until full Xcode is installed from the App Store. Left as-is per your choice to not set up a run target yet.

---

## Step 2 — Folder skeleton + move `App.tsx`

### 1. Created the `src/` structure from `ARCHITECTURE.md` §4
```bash
mkdir -p src/app/screens src/core/room src/core/content src/core/turn \
  src/core/storage src/games/undercover/config src/games/undercover/screens \
  src/games/undercover/logic src/packs src/shared/components src/shared/theme src/i18n
```
Added `export {};` stub `index.ts` files in each empty engine/module folder (so each is committed as a valid TS module, not a truly-empty directory git can't track).

### 2. Moved the app entry component
- Copied the existing `App.tsx` body into `src/app/App.tsx` unchanged.
- Replaced root `App.tsx` with a one-line re-export: `export { default } from './src/app/App';`
- Confirmed `index.js` (`import App from './App'`) and `__tests__/App.test.tsx` (`import App from '../App'`) both still resolve correctly through the re-export — no changes needed to either.

### 3. Verification — hit one pre-existing (unrelated) error

```bash
npx jest
→ Validation Error: Preset @react-native/jest-preset not found.
```
Cause: **pre-existing gap in the project template**, not caused by this step — `jest.config.js` referenced `@react-native/jest-preset` but it was never listed in `package.json` or installed. Confirmed via `ls node_modules/@react-native/` — every other `@react-native/*` package was present except this one.
Fix:
```bash
npm install --save-dev @react-native/jest-preset@0.86.0
```

**Verification after fix**: `tsc --noEmit` clean, `eslint .` clean, `npx jest` → 1/1 passing.

---

## Step 3 — Navigation shell + theme

### 1. Built the theme module
Created `src/shared/theme/{colors,spacing,typography,useTheme}.ts` + barrel `index.ts`. Pure, no native deps, no errors.

### 2. Built navigation
- `src/app/screens/Home.tsx` — hub screen with one card, navigates to `Undercover`.
- `src/games/undercover/screens/Placeholder.tsx` — stand-in screen (real Lobby comes in Step 9 of the plan).
- `src/app/Navigation.tsx` — native-stack navigator with a typed `RootStackParamList`.
- Rewrote `src/app/App.tsx` to render `GestureHandlerRootView → SafeAreaProvider → NavigationContainer → RootNavigator`, fully replacing the RN template's default placeholder screen.
- Added `import 'react-native-gesture-handler';` as the very first line of `index.js` (required by that library — must be the first import in the entry file).

### 3. Verification — hit three errors in sequence

**Error A — lint warning**
```
src/app/App.tsx
  16:36  warning  Inline style: { flex: 1 }  react-native/no-inline-styles
```
Fix: moved the inline `{ flex: 1 }` into a `StyleSheet.create({ root: { flex: 1 } })`, consistent with the rest of the codebase.

**Error B — Jest couldn't parse `@react-navigation`'s ESM output**
```
npx jest
→ SyntaxError: Unexpected token 'export'
  at node_modules/@react-navigation/native/lib/module/index.js:3
```
Cause: the RN Jest preset's default `transformIgnorePatterns` only whitelists `react-native` and `@react-native*` packages for transformation — `@react-navigation/*` and the various `react-native-*` community packages ship untranspiled ESM and were being skipped.
Fix: extended `jest.config.js`:
```diff
 module.exports = {
   preset: '@react-native/jest-preset',
+  transformIgnorePatterns: [
+    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*)/)',
+  ],
 };
```

**Error C — gesture-handler native module not mocked in tests**
```
npx jest
→ Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found.
```
Cause: `react-native-gesture-handler` requires its own Jest setup file to mock its native module; it wasn't registered.
Fix: added `setupFiles` to `jest.config.js`, explicitly keeping the original preset's setup file alongside the new one (Jest does not automatically merge `setupFiles` arrays between a preset and the project config, so both had to be listed explicitly or the preset's RN mocks would have been silently dropped):
```js
setupFiles: [
  require.resolve('@react-native/jest-preset/jest/setup.js'),
  require.resolve('react-native-gesture-handler/jestSetup.js'),
],
```

**Result after all three fixes**: `eslint .` clean, `npx jest` → 1/1 passing, `tsc --noEmit` clean.

---

## Summary of every file touched, Steps 1–3

| File | Change |
|---|---|
| `package.json` / `package-lock.json` | +11 dependencies (nav, mmkv, zustand, reanimated, gesture-handler, i18n, worklets, nitro-modules, jest-preset) |
| `babel.config.js` | added Reanimated plugin |
| `ios/Podfile.lock` | regenerated by `pod install` (83 pods) |
| `jest.config.js` | added `transformIgnorePatterns` and `setupFiles` |
| `index.js` | added `react-native-gesture-handler` top import |
| `App.tsx` (root) | now a thin re-export of `src/app/App.tsx` |
| `src/app/App.tsx` | navigation/gesture/safe-area root wiring |
| `src/app/Navigation.tsx` | new — root stack navigator |
| `src/app/screens/Home.tsx` | new — hub screen |
| `src/games/undercover/screens/Placeholder.tsx` | new — stand-in screen |
| `src/shared/theme/*.ts` | new — colors, spacing, typography, `useTheme` |
| `src/core/{room,content,turn,storage}/index.ts` | new — empty barrel stubs |
| `src/games/undercover/{config,logic}/index.ts` | new — empty barrel stubs |
| `src/shared/components/index.ts`, `src/i18n/index.ts` | new — empty barrel stubs |
| `src/packs/.gitkeep` | new — placeholder so the folder is tracked |

Every step ended with the same three checks green: `npx tsc --noEmit`, `npx eslint .`, `npx jest`.
