# Build Log — Milestone C (Undercover Game Module, Steps 8–13)

Companion to [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) and [BUILD_LOG.md](./BUILD_LOG.md) (Steps 1–3). Covers Steps 8–13 — the full pass-and-play Undercover game loop, Lobby through Game Over. Same format as the earlier log: what was built, what broke, how it was fixed, and how it was verified.

**Note on scope**: Milestone C in the plan runs through **Step 14** (Home Hub registry refactor). Step 14 is now done — see [Step 14](#step-14--home-hub-registry-refactor) below. Everything else below is Steps 8–13.

Every step ended with the same three checks green: `npx tsc --noEmit`, `npx eslint src --ext .ts,.tsx`, `npx jest --no-coverage`. Where noted, steps also went through manual on-device testing on an Android emulator (Pixel_8, API 34) — see [Manual testing summary](#manual-testing-summary) at the end.

---

## Step 8 — Game config + role assignment logic

Pure logic, no UI. Three new files under `src/games/undercover/`:

- **`config/index.ts`** — `UNDERCOVER_MIN_PLAYERS`/`MAX_PLAYERS` (3/20) and the three variants (`classic`, `mrWhite`, `multiUndercover`), each carrying `mrWhiteEnabled` and an `undercoverCount(playerCount)` formula. Extends the platform-generic `VariantConfig` from `core/types.ts` rather than inventing a parallel type.
- **`logic/assignRoles.ts`** — clamps each variant's undercover-count formula so at least 1 civilian always remains (`Math.min(Math.max(1, variant.undercoverCount(n)), n - mrWhiteCount - 1)`), builds the role list, shuffles it via the existing `core/content` Fisher–Yates `shuffle()` (reused, not reimplemented), and pairs `civilian`/`undercover` roles with the pack's two words while Mr. White gets `word: null`.
- **`logic/winCondition.ts`** — `checkWinner(remainingRoles)`, implementing the architecture doc's rule *literally*: civilians only win once **both** undercover and Mr. White are eliminated (not just undercover); undercover wins at parity-or-better against remaining civilians; otherwise `null` (game continues).

**Testing**: 64 new unit tests — every player count 3–20 across all three variants asserting exact role counts, assignment correctness (every player covered once, correct word per role, roles aren't positionally fixed — verified with a seeded RNG across 20 seeds, not `Math.random()`, to avoid flakiness), and win-condition edge cases (last undercover eliminated, Mr. White alive blocks a civilian win, parity, majority, fully-eliminated).

---

## Step 9 — Lobby screen

- **`screens/Lobby.tsx`** — add/remove players (validated through Step 6's `RoomEngine`), pick a variant, "Start Game" gated by `isRoomReadyForGame` against the config's min/max.
- **`UndercoverNavigator.tsx`** — new nested stack (`Lobby → RoleReveal`), matching the architecture doc's "per-game nested stack" pattern. Root navigator now mounts this instead of the old single placeholder screen; removed the now-unused `Placeholder.tsx`.
- **`screens/RoleReveal.tsx`** — minimal placeholder for now (real build is Step 10); Start navigates here without crashing.

### Bug found and fixed: Android keyboard swallows the first tap

**Symptom** (found via manual device testing, not caught by lint/tsc/jest): typing a player name and tapping "Add" while the keyboard was still open only dismissed the keyboard — the press didn't register. A second tap was needed.

**Cause**: the `ScrollView` wrapping the Lobby form had no `keyboardShouldPersistTaps`, so Android's default behavior is to swallow the first outside-tap as a keyboard-dismiss action rather than passing it through to the touchable underneath.

**Fix**:
```diff
 <ScrollView
   style={[styles.container, { backgroundColor: colors.background }]}
   contentContainerStyle={styles.content}
+  keyboardShouldPersistTaps="handled"
 >
```

**Testing**: 15 unit tests already existed for `RoomEngine` (from Step 6). No new unit tests for the screen itself (screen logic is thin — delegates to `RoomEngine`/`config`). Verified manually on-device: added/removed players, switched variants, confirmed Start disabled below 3 players and enabled at 3+, confirmed the keyboard fix with a single-tap add.

---

## Step 10 — Role Reveal screen (pass-and-play)

- **`screens/RoleReveal.tsx`** (full implementation) — one card per player in shuffled turn order, using Reanimated (`useSharedValue` + `useAnimatedStyle` + `withTiming`) for a 3D flip (`rotateY` + `backfaceVisibility: 'hidden'`) between a face-down "Tap to reveal" side and the word side.
  - **Identity gate**: nothing is shown until the current player taps "Yes, that's me" in response to "Are you sure you're `[Name]`?" — directly satisfies the DoD's anti-leak requirement.
  - **Reveal-then-hide gate**: "Pass to next player" / "Start Clue Phase" stays disabled until the card has been revealed *and* hidden again, so no one can hand off the device mid-reveal.
  - Civilians/Undercover show their word + a role label; Mr. White shows "No word — bluff!".
- **`contentEngine.ts`** — a module-level singleton `ContentEngine` bound to the seed pack, so the same no-repeat deck persists across the whole app session (not recreated per screen).
- Game-start orchestration (draw pair → assign roles → shuffle turn order → `TurnEngine.startGame()`) moved into `Lobby.tsx`'s `handleStart`, so `RoleReveal` just reads from `TurnEngine`/`RoomEngine` instead of recomputing on mount.
- Added a `ClueTurn` placeholder screen and route (Step 11 builds it); both `RoleReveal` and `ClueTurn` set `headerBackVisible: false` since backing out mid-round would be confusing/risky.

### Bugs found and fixed

1. **Rules-of-Hooks violation**: `useAnimatedStyle` calls were originally placed *after* early `return` statements (the "no active game" and "unknown player" guards), meaning those hooks would be skipped on some renders — a real crash risk (React throws "Rendered fewer hooks than expected"). Fixed by hoisting all hook calls above every conditional return, before writing any manual test.
2. **Jest couldn't run at all once Reanimated/Worklets code was imported anywhere in the tree**:
   ```
   [Worklets] Native part of Worklets doesn't seem to be initialized.
   ```
   Cause: `react-native-reanimated`/`react-native-worklets` need real native bindings that don't exist under Jest, and the RN Jest preset's default module resolution picks `.native.ts` variants that require them.
   Fix: wired the package's own Jest resolver into `jest.config.js`:
   ```diff
    module.exports = {
      preset: '@react-native/jest-preset',
   +  resolver: 'react-native-worklets/jest/resolver.js',
      transformIgnorePatterns: [...],
    };
   ```
   This forces Jest to resolve non-native fallbacks for worklets-related imports, same class of fix as the `react-native-mmkv` Jest mock from Step 5.

**Testing**: no new unit tests (screen is UI-only; underlying logic already covered by `assignRoles`/`ContentEngine`/`TurnEngine` tests). Extensive manual device testing with 4 players (Mr. White variant): confirmed no word was ever visible before identity confirmation for any player, both civilians correctly shared the identical word while Undercover got the paired word, Mr. White correctly saw "No word — bluff!", state fully reset between players, and the final player's button read "Start Clue Phase" (not "Pass to next player") and transitioned cleanly with zero crashes.

---

## Step 11 — Clue Turn screen

- **`screens/ClueTurn.tsx`** — handles **both** the `clueTurn` and `discussion` `TurnEngine` phases in one screen component (the plan has no separate Discussion route). Shows round number, whose turn it is, a live player list (current player highlighted, finished players marked "Done"), and a button reading "Next Player" until the last active player, then "Start Discussion". In the `discussion` phase it shows the open-floor prompt and "Start Vote", which calls `TurnEngine.startVote()` and navigates to a new `Vote` placeholder screen (Step 12 builds it).
- Turn cycling and eliminated-player skipping both live entirely in `TurnEngine.advanceClueTurn()` (built in Step 7) — this screen has **no local component state at all**, it's purely derived from `useTurnStore`/`useRoomStore`, so there was nothing to reset on re-focus.

**Testing**: no new unit tests (purely derived rendering). Manual device test with 3 players: confirmed turn order matched RoleReveal's shuffled order, "Done" labels appeared correctly, the last player saw "Start Discussion" instead of "Next Player", and "Start Vote" transitioned cleanly. Could **not** manually verify the "skips already-eliminated players in later rounds" half of this step's own DoD yet at the time (no elimination existed in the app until Step 12) — that was covered by Step 7's existing `TurnEngine` unit tests, and got a live on-device confirmation later, during Step 13's testing (Round 2's turn order correctly excluded the eliminated Mr. White).

---

## Step 12 — Vote & Elimination screen

- **`screens/Vote.tsx`** — each active player privately casts a vote (same identity-confirm pass-and-play pattern as RoleReveal), never able to vote for themselves. Nothing is tallied until every active player has voted.
  - **Clear winner**: shows the full tally, reveals the eliminated player's name + role, then "Continue".
  - **Tie**: shows the tally, names the tied players, offers "Revote" — restarts voting with every active player voting again, but candidates narrowed to only the tied players.
- "Continue" wires into `TurnEngine`: `eliminatePlayer()` → `continueAfterElimination()` (branches to `MrWhiteGuess` if the eliminated player was Mr. White) → otherwise computes the winner via Step 8's `checkWinner()` and calls `resolveWinCheck()`, landing on `GameOver` if the game just ended or back on `ClueTurn` for the next round if not.
- Added `MrWhiteGuess.tsx` and `GameOver.tsx` placeholders (Step 13 builds them) and wired both into `UndercoverNavigator`.

**Testing**: no new unit tests (screen-level orchestration only; the vote-tallying logic is simple enough to be exercised directly in manual testing rather than warranting isolated unit coverage). Manual device test with 3 players, specifically targeting the DoD's tie-vote requirement:
1. Forced a genuine 3-way tie (one vote each) — app correctly showed "It's a tie between Anya and Chetan and Bilal — revote!"
2. Tapped Revote — correctly restarted voting from the first voter with all three still eligible.
3. Converged votes on one candidate (2 vs 1 vs 0) — got a clean tally and role reveal ("Anya was a Civilian!").
4. Tapped Continue — eliminating a civilian in a 3-player Classic game brings it to 1v1 parity, so `checkWinner` correctly resolved an immediate Undercover win and auto-navigated straight to `GameOver`, skipping another Clue round. Zero crashes.

---

## Step 13 — Mr. White Guess + Game Over screens

- **`screens/MrWhiteGuess.tsx`** — one text-input guess, compared **case- and whitespace-insensitively** against the civilians' word (`.trim().toLowerCase()` on both sides). Correct guess → immediate `gameOver` with `winner: 'mrWhite'`; incorrect → falls through to the shared win-check helper.
- **`screens/GameOver.tsx`** — winner banner, full role-reveal list for every player (name, role, word, eliminated status), "Play Again" (redraws a fresh word pair, reshuffles roles, same players, **skips Lobby entirely**), "New Game" (back to Lobby, roster preserved).
- **`gameFlow.ts`** (new) — extracted the game-start orchestration into `startUndercoverRound(variantId)` and the post-elimination win-check orchestration into `resolveWinCheckAndNavigate(navigation)`, so `Lobby`, `Vote`, and `MrWhiteGuess` all go through identical logic instead of three copies of the same draw/assign/shuffle or win-check/navigate code.
- **`gameSession.ts`** (new) — a tiny non-reactive module-level variable tracking "last used variant" (`setLastVariantId`/`getLastVariantId`), so `GameOver`'s "Play Again" can replicate the variant without threading a param through five screens' navigation types.

### Bug found and fixed *before* it could bite in testing: stale screen state across "Play Again"

React Navigation keeps stack screens **mounted** rather than remounting them when you navigate back to an existing route. That meant `RoleReveal`, `Vote`, and `MrWhiteGuess` — all of which hold local component state (current card index, in-progress votes, the last guess) — would replay with **stale state left over from the previous game** on every "Play Again", and `Vote` specifically would also go stale on the **second voting round within the same game** (since "Start Vote" navigates back to the same mounted `Vote` instance every round).

**Fix**: added `useFocusEffect(useCallback(() => { ...reset local state... }, [...]))` to all three screens, resetting their walkthrough/voting state on every focus transition rather than only at mount. Read fresh values via `useTurnStore.getState()` inside the callback (not the reactive hook value) so the effect only fires on genuine focus/blur transitions, not on every re-render.

This was found and fixed by reasoning through React Navigation's mounting model *before* running the "Play Again" test, not discovered as a bug during testing.

### Investigation: a screen that genuinely looked stuck (turned out not to be a bug)

During manual testing of the "Play Again" flow, the RoleReveal confirm button appeared completely unresponsive after a Play Again — tapping "Yes, that's me" did nothing, repeatedly. Investigated with temporary `console.log` statements (checked via `adb logcat | grep ReactNativeJS`, since this Metro instance doesn't forward console output to its own terminal): the `useFocusEffect` reset fired exactly once as expected, but `handleConfirmIdentity` never fired at all. Root cause turned out to be **two testing artifacts**, not app bugs:
1. I was reusing a button coordinate (`y=897`) that belonged to the `Vote` screen's confirm button from earlier in the session — `RoleReveal`'s actual confirm button is at `y=1497`. Using the correct coordinate fixed it immediately.
2. A separate, single occurrence of the same symptom was traced to editing the source file (removing the debug `console.log`s) *while* the app was mid-flow — React Fast Refresh reset the component's local state as a side effect of the hot-reload, which is expected dev-tool behavior, not a production bug.

Debug logging was removed before finishing the step; confirmed clean via `grep -n "DEBUG\|console.log"` returning nothing.

**Testing**: no new unit tests (screen-level orchestration; underlying `checkWinner`/`resolveMrWhiteGuess` logic already covered by Step 8/Step 7 unit tests). Extensive manual device testing covering every remaining win path and both restart options:
- Mr. White eliminated → correct guess, including deliberately typing `" HORSE "` (padded, uppercase) against the stored word `"Horse"` to verify the case/whitespace-insensitive match → Mr. White wins.
- Mr. White eliminated → wrong guess → correctly fell through to Round 2, which **also gave the first live confirmation of Step 11's "skips eliminated players" DoD**: the eliminated Mr. White was correctly absent from Round 2's turn order.
- Undercover eliminated via vote in a 3-player game → immediate Civilians win.
- "Play Again" end-to-end: skipped Lobby, landed fresh on RoleReveal, and the word pair genuinely changed on every replay across the session (`Coach/Captain` → `Momo/Dumpling` → `Stadium/Arena` → `Marvel/DC`), confirming the Step 5 no-immediate-repeat deck logic holds across full-game replays, not just within a single game.
- "New Game" verified returning to Lobby with the same player roster intact.
- Zero crashes across the entire session.

---

## Step 14 — Home Hub registry refactor

Closed the scope gap noted at the top of this doc. Two new/changed files:

- **`src/app/gameRegistry.ts`** (new) — the `GameModule` interface (`id`, `name`, `description`, `minPlayers`, `maxPlayers`, `route`) and a `gameModules: GameModule[]` array with a single `undercover` entry, sourcing its player-count bounds from `games/undercover/config` rather than duplicating the constants. `route` is typed as `keyof Omit<RootStackParamList, 'Home'>` via a type-only import from `app/Navigation.tsx`, so it's erased at compile time and doesn't introduce a runtime cycle between the registry and the navigator.
- **`src/app/screens/Home.tsx`** — replaced the single hardcoded Undercover `Pressable` with a `.map()` over `gameModules`, navigating to each module's `route` on press.

**DoD check**: adding a second title now only requires appending an entry to `gameModules` — no changes to `Home.tsx` needed. (Registering the new game's own stack screen in `Navigation.tsx` remains a separate, expected step — Step 14's DoD is scoped to hub *listing*, not full route auto-registration.)

**Testing**: `npx tsc --noEmit`, `npm run lint`, and the full `npm test` suite (96 tests) all green. Not manually re-tested on-device since Home's rendered output is unchanged for the single-module case (same card, same navigation target) — the refactor is structural.

---

## Manual testing summary

All manual testing this milestone was done on an Android emulator (`Pixel_8`, API 34, arm64) via `adb`, since no simulator/emulator existed at the start of this work — setting that up (Homebrew, Android SDK command-line tools, AVD creation, `react-native run-android`) was a separate prerequisite piece of work, not part of Milestone C itself. Screenshots and `uiautomator dump` XML were used throughout to get exact tap coordinates and verify rendered text, rather than guessing coordinates from screenshots alone — this caught several coordinate-based testing mistakes (see Step 13's investigation above) that would otherwise have looked like app bugs.

Full playthroughs exercised, across multiple app sessions:
- 3-player Classic game, single elimination → immediate win.
- 4-player Mr. White variant, full round with tie-vote → revote → elimination → Mr. White correct guess → win.
- Same setup with a wrong guess → Round 2 with correct eliminated-player skip → second elimination → win.
- Multiple consecutive "Play Again" cycles confirming fresh word pairs each time.
- "New Game" back to Lobby with roster preserved.

---

## Summary of every file touched, Steps 8–13

| File | Change |
|---|---|
| `src/games/undercover/config/index.ts` | new — variants, min/max players |
| `src/games/undercover/logic/assignRoles.ts` | new |
| `src/games/undercover/logic/winCondition.ts` | new |
| `src/games/undercover/logic/__tests__/*.test.ts` | new — 64 tests |
| `src/games/undercover/logic/index.ts` | barrel export |
| `src/games/undercover/contentEngine.ts` | new — `ContentEngine` singleton |
| `src/games/undercover/gameFlow.ts` | new — `startUndercoverRound`, `resolveWinCheckAndNavigate` |
| `src/games/undercover/gameSession.ts` | new — last-used-variant tracker |
| `src/games/undercover/UndercoverNavigator.tsx` | new — nested stack, grew from `Lobby` only to `Lobby → RoleReveal → ClueTurn → Vote → MrWhiteGuess → GameOver` |
| `src/games/undercover/screens/Lobby.tsx` | new (Step 9), edited (Step 10 orchestration, Step 13 shared helpers) |
| `src/games/undercover/screens/RoleReveal.tsx` | new (Step 9 placeholder → Step 10 full build), edited (Step 13 `useFocusEffect`) |
| `src/games/undercover/screens/ClueTurn.tsx` | new (Step 10 placeholder → Step 11 full build) |
| `src/games/undercover/screens/Vote.tsx` | new (Step 12), edited (Step 13 shared helper + `useFocusEffect`) |
| `src/games/undercover/screens/MrWhiteGuess.tsx` | new (Step 12 placeholder → Step 13 full build) |
| `src/games/undercover/screens/GameOver.tsx` | new (Step 12 placeholder → Step 13 full build) |
| `src/games/undercover/screens/index.ts` | barrel, grew across every step |
| `src/games/undercover/screens/Placeholder.tsx` | deleted (Step 9, superseded by real `Lobby.tsx`) |
| `src/app/Navigation.tsx` | root now mounts `UndercoverNavigator` instead of a single placeholder screen |
| `jest.config.js` | added `resolver: 'react-native-worklets/jest/resolver.js'` (Step 10) |

Every step ended with `tsc --noEmit`, `eslint`, and `jest` all green — 96/96 tests passing by the end of Step 13, zero lint warnings, zero type errors.
