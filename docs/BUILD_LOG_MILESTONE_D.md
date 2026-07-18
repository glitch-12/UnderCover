# Build Log — Milestone D (Polish & Quality Gate, Steps 15–17)

Companion to [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), [BUILD_LOG.md](./BUILD_LOG.md) (Steps 1–3), and [BUILD_LOG_MILESTONE_C.md](./BUILD_LOG_MILESTONE_C.md) (Steps 8–14).

---

## Step 15 — Visual polish pass

**Audited, not rebuilt.** Steps 9–13 already built every Undercover screen against the Step 3 theme (`spacing`/`typography`/`useTheme`), so by the time Milestone C closed there were no unstyled/default RN placeholder screens left to fix:

- **Card flip animation** — already implemented in `RoleReveal.tsx` (Step 10) via Reanimated (`useSharedValue`/`useAnimatedStyle`/`withTiming`, 3D perspective flip).
- **Turn indicator** — already implemented in `ClueTurn.tsx` (Step 11): an ordered list of active players with the current turn highlighted in the theme's primary color and completed turns marked "Done".
- **Timer ring** — the plan marks this optional per-variant; not built, no variant currently requires it.
- **Consistent theme usage** — verified across all six screens (`Lobby`, `RoleReveal`, `ClueTurn`, `Vote`, `MrWhiteGuess`, `GameOver`): every color reference goes through `useTheme()`, every text style through the `typography` scale, every gap/padding through `spacing`.

**DoD met**: no unstyled/default RN placeholder screens remain. No code changes were needed for this step.

---

## Step 16 — i18n scaffolding

`src/i18n/index.ts` previously only had a stub (`export {};`) — `i18next`/`react-i18next` were installed but never wired up, and every screen had hardcoded English strings. This step closed that gap:

- **`src/i18n/en.json`** (new) — every user-facing string from the six `games/undercover/screens/*` files, namespaced per screen (`lobby.*`, `roleReveal.*`, `clueTurn.*`, `vote.*`, `mrWhiteGuess.*`, `gameOver.*`), plus a `common.*` namespace for the "pass the device / confirm identity / continue" strings shared verbatim between `RoleReveal` and `Vote`. Vote counts use i18next's built-in plural key suffixes (`voteCount_one`/`voteCount_other`) rather than a hand-rolled `vote(s)` string.
- **`src/i18n/index.ts`** — initializes `i18next` with `initReactI18next`, `en` as both `lng` and `fallbackLng`, and `escapeValue: false` (React already escapes, and RN has no HTML context to protect against).
- **`src/app/App.tsx`** — added a side-effect import of `../i18n` so initialization runs once at app boot, before any screen mounts.
- **All six screens** — replaced every literal string and every `Record<Role, string>` / `Record<Winner, string>` label map with `useTranslation()` + `t('namespace.key', { ...params })` calls, including interpolation (`{{name}}`, `{{number}}`, `{{count}}`) and dynamic keys (`` t(`gameOver.role.${role}`) ``).

**Scope boundary** (kept deliberately out, matching the plan's literal wording — "no hardcoded strings in `games/undercover/screens/*`"):
- `src/core/room/RoomEngine.ts`'s validation error strings (e.g. `Need at least {n} players`) are rendered inside `Lobby.tsx` but originate in `core/`, which is meant to stay platform-generic and Undercover-agnostic. Translating them would mean either duplicating min/max-player copy into the locale file per game, or teaching `core/room` about i18n — a bigger architectural call than this step's DoD asks for.
- `games/undercover/config/index.ts`'s variant `name`/`description` strings (shown in `Lobby.tsx`'s variant picker) are config data, not screen-file literals, for the same reason.

Both are one-line-per-string follow-ups if/when a second locale actually ships; flagging here rather than doing it silently.

**Testing**: `npx tsc --noEmit`, `npm run lint`, and the full `npm test` suite (96 tests, including `__tests__/App.test.tsx` which renders the app with `i18n` now wired in) all green. Grepped all six screen files for stray capitalized string literals after the pass — none found.

**On-device verification** (Pixel_8 AVD, API 34, `adb`/`uiautomator` driven — see Step 17 below for the full run): confirmed every `t()` call actually resolves at runtime, not just at the type level — including the two cases `tsc` can't catch: i18next's plural key selection (`voteCount_one` vs `voteCount_other`) and the dynamic-key template literals (`` t(`gameOver.role.${role}`) ``, `` t(`roleReveal.role.${role}`) ``). Both worked correctly on-device.

---

## Step 17 — Test pass + manual QA checklist

**Unit suite**: green — `npm test`: 96/96 passing.

**Manual QA — in progress.** Ran the first full pass on a real target (Pixel_8 AVD, API 34) via `adb`/`uiautomator` (no `ANDROID_HOME`/`JAVA_HOME` in the default non-interactive shell — exported from `~/.zshrc`'s values: `JAVA_HOME=/opt/homebrew/opt/openjdk@17/...`, `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools`; `android/local.properties` didn't exist and was created with `sdk.dir` pointing at the same SDK path).

Covered:
- **3-player game, Mr. White variant, incorrect guess, Undercover win.** Home Hub → Lobby (Alice/Bob/Carol, Mr. White variant) → Role Reveal (pass-and-play confirm, card flip, all three role labels including the "No word — bluff!" blank case, last-player button correctly read "Start Clue Phase") → Clue Turn (turn indicator, "Done" tags, "Start Discussion" on the last turn) → Vote (votes tallied "Bob was Mr. White!") → Mr. White's Guess (wrong guess → "Not quite." + word reveal) → Game Over ("Undercover Wins!", per-player role/word lines, eliminated-suffix, Play Again / New Game).
- **4-player game, Classic variant, tie vote → revote.** Forced a 2–2 split (Alice/Bob), confirmed the tie string ("It's a tie between Alice and Bob — revote!"), confirmed the revote screen correctly narrows candidates to just the tied players (including the single-candidate-row case), resolved the revote, confirmed the game correctly continued to Round 2 rather than ending (the elimination wasn't the last Undercover).
- **App-kill-and-reopen mid-game.** Force-stopped the app mid-Round-2 (`adb shell am force-stop`) and relaunched (`am start`). Result: no crash — the app cold-starts cleanly back at the Home Hub. **Finding**: `RoomEngine`/`TurnEngine` (`src/core/room/RoomEngine.ts`, `src/core/turn/TurnEngine.ts`) are plain in-memory Zustand stores with no MMKV `persist` middleware — only `ContentEngine`'s word-pack deck cursor is MMKV-backed (`src/core/storage/mmkv.ts`). So a kill mid-game loses the roster and round state entirely; it does not resume. This may be acceptable for a pass-and-play game (nobody expects to resume after backgrounding kills the app), but it means the plan's Step 17 checklist wording — "confirms MMKV persistence doesn't break restart" — is trivially true only because there's nothing to break. If resuming mid-game after a kill is actually a product requirement, that's a real gap, not a checkbox.
- **3-player game, Mr. White variant, correct guess.** Same setup as above but this time Mr. White (Carol) correctly guessed the civilian word ("Camel") after being eliminated → "Correct!" → Game Over correctly showed "Mr. White Wins!".

**Still outstanding** (stopped here at the user's direction; not signed off):
- 20-player game.
- Multi-Undercover variant (only Classic and Mr. White were exercised above).
- `npm run lint` / `npm test` re-confirmation (no source changed during this QA pass, so not expected to regress, but not re-run after the on-device session).

No visual regressions, no crashes, no untranslated/missing-key strings observed across any of the runs above (`i18next` falls back to the raw key path if a key is missing, e.g. `"vote.voteCount_one"` — never observed).
