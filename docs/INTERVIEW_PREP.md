# Interview Prep — Undercover

Questions grounded in the actual code in this repo, ordered high-level → low-level, plus a testing section, a behavioral section built from real things that happened in this project, and a few "hand you the keyboard" exercises. File/line references point at real code so you can re-read before answering.

---

## 1. High-Level System Design & Product Architecture

1. **Walk through the architecture.** Why split into `src/core/` (`RoomEngine`, `TurnEngine`, `ContentEngine`) vs `src/games/undercover/`? What specifically does that buy you when a second game ships?
2. `docs/ARCHITECTURE.md` §3 proposes a `GameModule` interface (`id`, `minPlayers`, `maxPlayers`, `variants`, `assignRoles`, `RoundScreen`, `ResultScreen`) so new titles register with the Home hub without touching `RoomEngine`/navigation. What's the actual cost of designing this way from day one vs. building single-purpose and refactoring later? When would you *not* do this?
3. **Do you need a backend?** Reconstruct the reasoning in §5: what works with zero backend today, and what's the first thing that actually requires one? Why is a content-delivery API prioritized over realtime multiplayer in the roadmap (§10, Phase 1 before Phase 2)?
4. How would you design online multiplayer (each player on their own device) on top of the existing `TurnEngine` phase machine? What's the hardest part, and why (§11 calls out reconnection handling explicitly)?
5. `RoundState.phase` (`src/core/types.ts`) is an explicit 9-state machine: `lobby → roleAssignment → clueTurn → discussion → vote → elimination → mrWhiteGuess/winCheck → gameOver`. Why model it this way instead of a handful of booleans (`isVoting`, `isEliminated`, …)? What would go wrong with the boolean version at this state count?
6. How do the three shipped variants (Classic / Mr. White / Multi-Undercover in `src/games/undercover/config/index.ts`) avoid needing new screens? Trace exactly where variant-specific behavior plugs into `assignRoles`.
7. Words currently ship bundled in the binary (`src/packs/seed-en.json`). What's the actual plan to fix "words feel repetitive" without shipping app updates (§6.3)? What do you trade away by moving to a remote content API vs. just shipping a bigger local bundle?
8. If asked to add a second game module ("Guess the Person," per §2.3) tomorrow: what would you actually touch, and — just as important — what should you be able to leave alone?

## 2. Mid-Level — Mobile / React Native Engineering

9. Why Zustand here over Redux or plain Context? What did you give up?
10. Why MMKV over AsyncStorage for persistence?
11. `useRoomStore` and `useTurnStore` are two separate Zustand stores rather than one app-wide store. Why split them?
12. Every store action returns `{ success, error? }` (`RoomActionResult` / `TurnActionResult` in [RoomEngine.ts](../src/core/room/RoomEngine.ts) and [TurnEngine.ts](../src/core/turn/TurnEngine.ts)) instead of throwing. Why design it that way, and what does it mean for how the UI layer has to call these actions?
13. Walk through `src/shared/theme` (`darkColors`/`lightColors`, `useTheme`, `getContrastTextColor`). How would you add a third theme (e.g. high-contrast/accessibility) without touching every screen?
14. Walk through what actually happens from `npm run android` to pixels on screen — Metro bundling, Gradle native build, module autolinking.
15. **You hit a real one this session:** Android builds started failing with `Execution failed for task ':react-native-google-mobile-ads:compileDebugKotlin' ... Module was compiled with an incompatible version of Kotlin. The binary version of its metadata is 2.3.0, expected version is 2.1.0.` Root-cause this out loud: what does "Kotlin metadata version" mean, why does a *dependency's* Kotlin version matter to *your* build, and what are the possible fixes (bump your Kotlin, pin the dependency older, drop the dependency)?
16. `AndroidManifest.xml` needed `xmlns:tools` + `tools:replace="android:value"` to fix a `processDebugMainManifest` merge conflict. What does a manifest merge conflict actually mean, and when do you reach for `tools:replace` vs `tools:remove` vs fixing it at the source dependency?
17. Also hit this session: `pod install` failing under Ruby 4.0 with `undefined method 'untaint' for an instance of String`, then a second failure (`Unicode Normalization not appropriate for ASCII-8BIT`) even bypassing the project's pinned Bundler. What's actually going on (Ruby version drift vs. gem compatibility vs. locale/encoding), and how did routing around `bundle exec` with a system-installed CocoaPods + explicit `LANG=en_US.UTF-8` sidestep it? Is that a real fix or a workaround — what would the real fix be?
18. `react-i18next` is wired up in `src/i18n`, but only `en.json` exists, and `Home.tsx` still has hardcoded English strings (`"Party Game Hub"`, `"Pick a game to start playing"`). What's the actual mechanism a second locale needs end-to-end, and what would you flag as inconsistent about the current "i18n-ready" claim?

## 3. Low-Level — Code Reading & Algorithms

This is the meaty section — expect to be asked to trace these by hand.

19. [`shuffle()`](../src/core/content/deck.ts) is Fisher–Yates. Explain why it produces a uniform random permutation, and what's concretely wrong with the common `.sort(() => Math.random() - 0.5)` alternative (bias, not just "it's slower").
20. [`reshuffle()`](../src/core/content/deck.ts): explain exactly what it does — why split `allIds` into `fresh`/`recent`, shuffle each separately, and concatenate `fresh` then `recent`? What is `recentHistorySize` actually protecting against? What happens if `recentHistorySize >= allIds.length`?
21. Trace `drawFromDeck` for a 5-pair deck with `recentHistorySize = 1`, called 6 times back to back (deck exhausts and reshuffles once). Which specific pair *cannot* be drawn on call #6, and why?
22. [`ContentEngine.tryRestoreDeck`](../src/core/content/ContentEngine.ts) checks both `packId` *and* `packVersion` before trusting persisted state, and rejects the whole persisted deck (not just the drift) if `order.length !== allIds.length` after filtering stale ids. What bug does the version check prevent when you ship a content update? Why discard the *entire* deck instead of patching in the new ids?
23. [`resolveUndercoverCount`](../src/games/undercover/logic/assignRoles.ts): `Math.min(Math.max(1, variant.undercoverCount(playerCount)), maxUndercover)`. Walk through what each clamp defends against — what value could `variant.undercoverCount` return that would break the game without the outer `Math.min`, and what could it return that breaks it without the inner `Math.max`?
24. Multi-Undercover's formula is `Math.floor(playerCount / 4)`. For `playerCount = 3` this evaluates to `0`. Trace `resolveUndercoverCount` for this input and explain why the game still ends up with exactly 1 Undercover, not 0.
25. `assignRoles` builds a flat `roles: Role[]` array, shuffles *that*, then zip-maps `shuffledRoles[index]` onto `players[index]`. Why shuffle the roles array instead of shuffling the players array (or picking `undercoverCount` random player indices directly)? Is there a correctness difference or just style?
26. [`checkWinner`](../src/games/undercover/logic/winCondition.ts): `undercoverCount > 0 && undercoverCount >= civilianCount`. Why `>=` rather than `>`? Construct the 2-player endgame (1 Undercover, 1 Civilian left) and explain the result — does this match what §2.1 step 7 of the architecture doc claims ("Undercover count ≥ remaining Civilians → Undercover wins")?
27. What does `checkWinner` return in a state where Mr. White is still alive and Undercover count is 0? Is that reachable given the `TurnEngine` routes Mr. White eliminations through `mrWhiteGuess` before `winCheck` ([TurnEngine.ts](../src/core/turn/TurnEngine.ts) `continueAfterElimination`)?
28. `TurnEngine.eliminatePlayer(playerId)` takes the eliminated player's id as a *given* — it doesn't tally votes itself. Where does majority-vote tallying actually happen (hint: check `Vote.tsx`), and why doesn't `TurnEngine` own that logic?
29. `activePlayerOrder(turnOrder, eliminatedPlayerIds)` recomputes a filtered array on every single store action rather than maintaining it as state. At 20 players and a full game, is that a real performance concern? What would you have to be careful about if you cached it instead?
30. Every `TurnStore` action opens with a phase guard: `if (state.phase !== 'X') return wrongPhase(...)`. What category of bugs does this prevent? What's the cost (boilerplate, and what happens if you *forget* the guard on a new action)?
31. `RoomEngine.addPlayer` validates empty-after-trim and the `maxPlayers` cap, but not duplicate names or a max length. Is that a real gap for this app? If so, which layer should own that validation — the store, the screen, or somewhere else — and why?
32. `generatePlayerId()` in [RoomEngine.ts](../src/core/room/RoomEngine.ts) is a module-level `idCounter`, not a UUID. What could go wrong with this pattern under Jest module re-imports or Metro Fast Refresh during dev? Does it actually bite here — why or why not?

## 4. Testing

33. The suite is 97 tests across 7 files — `RoomEngine`, `TurnEngine`, `ContentEngine`, `deck`, `assignRoles`, `winCondition`, plus one `App` smoke test — and almost none of it renders a screen component directly. Why is pure-logic testing prioritized here, and what's *not* covered as a result?
34. `assignRoles(players, variant, wordPair, rng = Math.random)` and `new ContentEngine(pack, { store?, rng? })` both accept an injectable `rng`/`store`. Why? Sketch a deterministic test that proves `shuffle()` is unbiased (or at least exercises every permutation for a small input) using this seam.
35. How would you test that `resolveUndercoverCount` never returns `0` for *any* variant across player counts 3–20 — property-based test vs. an exhaustive loop over the range? Which would you actually write and why?
36. This session, Play Store screenshots were captured by literally driving a booted Android emulator with `adb`/`uiautomator` — not a snapshot or component test. What does that approach catch that a component test wouldn't, and what's the cost (flakiness, coordinates breaking when layout changes — this actually happened mid-session when player-count text shifted button positions)?

## 5. Behavioral / Project Narrative

These are all real — pull from what actually happened.

37. Tell me about a time you found a bug that predated your own change and had to decide whether it was in scope to fix. *(`Home.tsx` had a pre-existing unclosed-brace syntax error — `card: { listCard: {...}` never closed — breaking `tsc` entirely, discovered while doing unrelated store-asset work.)*
38. Tell me about a dependency conflict you couldn't resolve cleanly, and how you decided when to stop trying. *(`react-native-google-mobile-ads` required Kotlin metadata 2.3.0; the project was pinned to 2.1.20. Bumping Kotlin alone cascaded into new failures in `react-native-safe-area-context` and `react-native-gesture-handler`. Reverted the bump and removed the AdMob dependency entirely instead of chasing a full toolchain upgrade.)*
39. How do you decide when a "five more minutes" debugging problem has actually become a "stop and change the plan" problem?
40. You found an uncommitted, half-finished change already sitting in the working tree (an AdMob manifest edit missing `tools:replace`) before you'd made any edits of your own. How do you handle discovering in-progress work that isn't yours mid-task?
41. Walk through preparing real store-submission assets end to end — icon, feature graphic, screenshots, descriptions, privacy policy, Data Safety form answers. What actually took the most effort, and what surprised you about what Play Store requires versus what you assumed going in?

## 6. "Hand you the keyboard" exercises

Things you could plausibly be asked to implement live, using the existing engine:

- **Duo/Team mode** (listed as a future variant in §2.2): add a `teamId` to `RoleAssignment`, add a new `undercoverVariants` entry in `src/games/undercover/config/index.ts`, and decide how `assignRoles` should pair up Undercover teammates.
- **No-elimination ("bluff") round**: per §2.2, occasionally skip elimination for a round (discussion + vote happen, nobody is eliminated). Sketch the `TurnEngine` phase change needed — does `winCheck` still run that round?
- **Tie-vote handling**: the `Vote` screen's copy already implies this (`"It's a tie between {{names}} — revote!"` in `src/i18n/en.json`), but vote-tallying/tie-detection isn't in `TurnEngine`. Where would you put it, and write the test for a 2-way tie.
- **Weighted difficulty draws**: extend `drawFromDeck` so later rounds bias toward `difficulty: 'hard'` pairs, without breaking the no-repeat guarantee `reshuffle()` provides.
- **Duplicate player names**: add validation to `RoomEngine.addPlayer` rejecting case-insensitive duplicate names, plus the test for it.
