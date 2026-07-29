# Roadmap: Codenames Game Module + Reusable Rule Book

Status: Draft v1 · Companion to [ARCHITECTURE.md](./ARCHITECTURE.md) and [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) · Date: 2026-07-20

## Context

The app (`UnderCover`) is built as a party-game platform: one shared "core" (RoomEngine, ContentEngine, TurnEngine, MMKV storage) plus per-game modules registered in [`gameRegistry.ts`](../src/app/gameRegistry.ts), following the plan in [ARCHITECTURE.md](./ARCHITECTURE.md). Today only one game exists — **Undercover**. This roadmap adds **Codenames** as a second game module, including a **Rule Book page**.

Since this app is explicitly designed to grow into a multi-game hub, and a "how to play" page is something every game will eventually need, the Rule Book is being built as a **reusable shared screen** (content supplied per-game) rather than a one-off Codenames screen. This roadmap is scoped as **Milestone E**, following the existing `docs/IMPLEMENTATION_PLAN.md` / `docs/BUILD_LOG_MILESTONE_*.md` convention (Milestones A–D are already complete per [BUILD_LOG_MILESTONE_D.md](./BUILD_LOG_MILESTONE_D.md)).

## Folder structure — shared vs. independent

Strict separation is required: anything genuinely common lives under `src/shared/` or `src/core/` and is imported by both games; everything specific to one game lives only inside that game's own folder and is never imported by the other game. `games/undercover/` is not touched by this work at all.

```
src/
  core/                        # SHARED — game-agnostic engines (existing, reused as-is)
    room/                      #   RoomEngine: player roster (reused by Codenames)
    content/deck.ts            #   shuffle/no-repeat primitives (reused by Codenames)
    turn/                      #   Undercover-only in practice — Codenames does NOT import this
    storage/                   #   mmkvStore (reused by Codenames)
    types.ts                   #   Player, WordPack, etc. — untouched

  shared/                      # SHARED — cross-game UI
    components/
      RuleBook.tsx             #   NEW, generic — no Codenames/Undercover text baked in
      Card.tsx, Button.tsx, PlayerRow.tsx, PassDevicePrompt.tsx, ...   # existing, reused
    theme/                     #   existing, reused

  games/
    codenames/                 # INDEPENDENT — nothing here is imported by undercover/
      config/index.ts
      logic/
        generateBoard.ts
        __tests__/generateBoard.test.ts
      codenamesContentEngine.ts
      codenamesStore.ts
      CodenamesNavigator.tsx
      screens/
        TeamSetup.tsx
        CodemasterReveal.tsx
        Board.tsx
        GameOver.tsx
        index.ts

    undercover/                # INDEPENDENT — existing, untouched by this work
      config/, logic/, screens/, gameFlow.ts, gameSession.ts, UndercoverNavigator.tsx

  packs/
    codenames-seed-en.json     # NEW — Codenames-only content, separate file from seed-en.json
    seed-en.json                # existing, Undercover-only, untouched

  i18n/en.json                  # SHARED FILE, separate namespaces: `codenames.*` (new) vs
                                 # `lobby.*`/`clueTurn.*`/etc. (existing, Undercover's) — no
                                 # key sharing between the two games' copy
```

Rule of thumb applied throughout the phases below: if a file would only ever be imported by one game's screens/logic, it goes inside that game's folder (`games/codenames/...`), never in `shared/` or `core/`. If it's genuinely engine-level and game-agnostic (roster management, shuffle algorithm, storage), it stays in `core/` and Codenames imports it the same way Undercover already does — no duplication, no forking.

## Key architectural decisions baked into this roadmap

- **Reuse `RoomEngine`** for the player roster (add/remove/reorder) — it's already game-agnostic.
- **Do not reuse `core/turn/TurnEngine`** — its `RoundPhase` type (`roleAssignment`, `clueTurn`, `vote`, `mrWhiteGuess`, …) is Undercover-specific despite living in `core/`, and Codenames' turn flow (team clue → guessing → pass turn) doesn't map onto it. Codenames gets its own lightweight round store inside `games/codenames/`, following the same Zustand + `{ success, error }` action-result pattern as `TurnEngine`/`RoomEngine` for consistency, without forcing a premature generalization of shared code.
- **Do not reuse `ContentEngine`/`WordPack`** as-is — those model word *pairs* (`civilianWord`/`undercoverWord`). Codenames needs a flat 25-word board per round. The underlying shuffle/no-repeat primitives in `core/content/deck.ts` (`createDeck`/`drawFromDeck`, which already operate on generic string IDs) are reused directly; a small `codenamesContentEngine.ts` wraps them around a new flat `CodenamesWordPack` type instead of `WordPack`.
- **Team assignment is Codenames-local state**, keyed by `playerId` against `useRoomStore`'s player list — no changes to the shared `Player` type in `core/types.ts`, keeping it game-agnostic per its existing comment.
- **Rule Book is a shared component**: `src/shared/components/RuleBook.tsx` (or a screen shell), rendering per-game content (sections/steps) passed in as data. Each `GameModule` gains an optional `rules` content field; a "Rules"/"?" icon on each game's Lobby header opens it. Undercover can adopt it later for free.

## Milestone E — Codenames Game Module (proposed phases)

### Phase E0 — Shared Rule Book component `[SHARED]`
- `src/shared/components/RuleBook.tsx` **(shared folder — importable by every game)**: generic screen/component that takes a title + ordered list of `{ heading, body }` sections and renders them with existing `ScreenContainer`/`typography`/`useTheme` primitives (matching existing shared-component conventions in `src/shared/components/`).
- Add a `RuleBook` route usable from any per-game navigator (e.g. each game's stack includes a `Rules` screen that renders `RuleBook` with that game's content), plus a header "?" icon button on Lobby screens to open it.
- **DoD**: component is game-agnostic (no Codenames- or Undercover-specific text baked in), unit-testable render with arbitrary content, matches light/dark theme.

### Phase E1 — Codenames module scaffolding `[codenames-only]`
- `src/games/codenames/` folder mirroring `src/games/undercover/` shape: `config/`, `screens/`, `logic/`, `CodenamesNavigator.tsx`. **Everything in this phase lives under `games/codenames/` — nothing is added to `games/undercover/` or to `shared/`.**
- `src/games/codenames/config/index.ts`: `CODENAMES_MIN_PLAYERS = 4`, `CODENAMES_MAX_PLAYERS`, board size constant (5×5 = 25), team card-count ratios (9/8/7/1).
- Register `codenames` in [`gameRegistry.ts`](../src/app/gameRegistry.ts) and add `Codenames` to `RootStackParamList` in [`Navigation.tsx`](../src/app/Navigation.tsx), same pattern as the existing `Undercover` entry. **These two files are the only shared-app-shell files touched** — they already exist to register per-game modules generically and aren't game-specific themselves.
- **DoD**: "Codenames" appears on the Home hub and navigates into an empty stack, app still compiles/boots.

### Phase E2 — Content: word pack + board generation `[codenames-only, reusing core/ primitives]`
- `src/packs/codenames-seed-en.json` **(new file, separate from `packs/seed-en.json`)**: flat list of ~200+ single words (new `CodenamesWordPack` shape: `{ id, name, locale, version, words: string[] }`).
- `src/games/codenames/codenamesContentEngine.ts` **(codenames-only file)**: wraps the existing `core/content/deck.ts` primitives (`[SHARED]`, reused unmodified) to draw 25 non-repeating words per game, persisted cursor via existing `mmkvStore` (`[SHARED]`, same approach as `ContentEngine.ts`).
- `src/games/codenames/logic/generateBoard.ts` **(codenames-only file)**: pure function taking 25 drawn words + starting team → assigns each word a hidden owner (`red` / `blue` / `neutral` / `assassin`) per the 9/8/7/1 ratio, shuffled.
- **Unit tests** (`src/games/codenames/logic/__tests__/generateBoard.test.ts`): correct counts per owner, exactly one assassin, no duplicate words, starting team always gets 9.
- **DoD**: tests pass; board generation is deterministic given an injected RNG (matching `ContentEngine`'s `rng` option pattern for testability).

### Phase E3 — Round state machine `[codenames-only]`
- `src/games/codenames/codenamesStore.ts` **(codenames-only file — the Undercover `core/turn/TurnEngine.ts` is not imported or modified)**: Zustand store using the same `{ success, error }` action-result pattern as `TurnEngine`/`RoomEngine` for consistency. Phases: `teamSetup → codemasterReveal → clueEntry → guessing → turnEnd → gameOver`. Actions: `startGame`, `revealKeyToCodemaster`, `submitClue(word, count)`, `guessCard(cardId)`, `endTurn`, `playAgain`.
- Win conditions: a team's win when all their cards are revealed; instant loss if the assassin card is guessed.
- **Unit tests** (`src/games/codenames/__tests__/codenamesStore.test.ts`) mirroring `core/turn/__tests__/TurnEngine.test.ts` style: drive a full game through both win paths (all-cards-found, assassin-hit).
- **DoD**: store logic fully covered by tests before any screen is built on top of it (matches this repo's "engines before screens" build order from `IMPLEMENTATION_PLAN.md`).

### Phase E4 — Screens `[codenames-only, composed from shared UI primitives]`
All four screens below live in `src/games/codenames/screens/` only. They *compose* existing shared primitives (`Button`, `Card`, `PlayerRow`, `PassDevicePrompt`, `Icon`, `ScreenContainer`, theme tokens) the same way Undercover's screens do — none of these primitives are modified, and no Codenames-specific markup is added to `shared/`.
- `TeamSetup` (Lobby equivalent): reuse `useRoomStore`/`PlayerRow`/`Button` like `games/undercover/screens/Lobby.tsx`; adds Red/Blue team toggle per player and Codemaster selection; header "?" opens the Phase E0 `RuleBook`.
- `CodemasterReveal`: pass-device screen reusing `PassDevicePrompt`, shows the hidden key grid privately per team before the round starts.
- `Board`: the 5×5 grid + current clue/remaining-guesses banner; Codemaster clue-entry UI; guesser tap-to-flip interaction with card-owner color reveal.
- `GameOver`: winner banner + full key reveal + "Play Again", mirroring `games/undercover/screens/GameOver.tsx`'s structure (not its code — a separate file).
- **DoD**: full playable local pass-and-play loop, all copy routed through `i18n` (new `codenames.*` namespace added to the shared `src/i18n/en.json`, following the Milestone D i18n pattern, kept separate from Undercover's existing namespaces) — no hardcoded strings in screen files.

### Phase E5 — Rule Book content + polish
- Write the actual Codenames rules content (setup, clue-giving, guessing, win conditions) as data passed into the Phase E0 `RuleBook` component, added to the `codenames.*` i18n namespace (kept separate from Undercover's namespaces in the same shared `en.json` file).
- Visual/theme pass consistent with Milestone D's Step 15 audit (all colors via `useTheme()`, spacing via `spacing` scale, card-owner colors defined in `shared/theme`).
- **DoD**: no unstyled/placeholder screens remain; rule book content reviewed for accuracy against official Codenames rules.

### Phase E6 — Verification
- `npx tsc --noEmit`, `npm run lint`, `npm test` (new suites from E2/E3 plus existing suite) all green.
- Manual on-device/simulator pass-and-play playtest: 4-player game through both win conditions (team completes all cards, assassin hit), plus opening the Rule Book from the Lobby.
