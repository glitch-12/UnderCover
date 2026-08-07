import { create } from 'zustand';
import type { CodenamesTeam } from './config';
import type { CardOwner, CodenamesCard } from './logic/generateBoard';
import { checkBoardWinner } from './logic/winCondition';

export interface CodenamesActionResult {
  success: boolean;
  error?: string;
}

export type CodenamesPhase = 'teamSetup' | 'codemasterReveal' | 'clueEntry' | 'guessing' | 'turnEnd' | 'gameOver';

export interface CodenamesClue {
  word: string;
  count: number;
}

export interface CodenamesRoundState {
  phase: CodenamesPhase;
  cards: CodenamesCard[];
  teamAssignments: Record<string, CodenamesTeam>;
  codemasters: Record<CodenamesTeam, string | null>;
  currentTeam: CodenamesTeam;
  currentClue: CodenamesClue | null;
  guessesRemaining: number;
  winner: CodenamesTeam | null;
}

interface CodenamesActions {
  startGame: (
    cards: CodenamesCard[],
    teamAssignments: Record<string, CodenamesTeam>,
    codemasters: Record<CodenamesTeam, string | null>,
    startingTeam: CodenamesTeam,
  ) => CodenamesActionResult;
  confirmCodemasterRevealSeen: () => CodenamesActionResult;
  submitClue: (word: string, count: number) => CodenamesActionResult;
  guessCard: (cardId: string) => CodenamesActionResult;
  endTurn: () => CodenamesActionResult;
  continueToNextTeam: () => CodenamesActionResult;
  playAgain: () => CodenamesActionResult;
  reset: () => void;
}

export type CodenamesStore = CodenamesRoundState & CodenamesActions;

function otherTeam(team: CodenamesTeam): CodenamesTeam {
  return team === 'red' ? 'blue' : 'red';
}

function createInitialRoundState(): CodenamesRoundState {
  return {
    phase: 'teamSetup',
    cards: [],
    teamAssignments: {},
    codemasters: { red: null, blue: null },
    currentTeam: 'red',
    currentClue: null,
    guessesRemaining: 0,
    winner: null,
  };
}

function wrongPhase(actual: CodenamesPhase, expected: CodenamesPhase): CodenamesActionResult {
  return { success: false, error: `Cannot do this from phase "${actual}" (expected "${expected}")` };
}

// After a card is revealed, decide what happens next: assassin ends the game
// immediately for the other team, completing your own team's cards wins,
// a wrong guess (neutral or the other team's card) ends the turn, and a
// correct guess either continues the turn (guesses remain) or ends it.
function resolveAfterReveal(
  cards: CodenamesCard[],
  revealedOwner: CardOwner,
  currentTeam: CodenamesTeam,
  guessesRemaining: number,
): Pick<CodenamesRoundState, 'phase' | 'winner' | 'guessesRemaining'> {
  if (revealedOwner === 'assassin') {
    return { phase: 'gameOver', winner: otherTeam(currentTeam), guessesRemaining: 0 };
  }

  const boardWinner = checkBoardWinner(cards);
  if (boardWinner) {
    return { phase: 'gameOver', winner: boardWinner, guessesRemaining: 0 };
  }

  if (revealedOwner !== currentTeam) {
    return { phase: 'turnEnd', winner: null, guessesRemaining: 0 };
  }

  const remaining = guessesRemaining - 1;
  return remaining > 0
    ? { phase: 'guessing', winner: null, guessesRemaining: remaining }
    : { phase: 'turnEnd', winner: null, guessesRemaining: 0 };
}

export const useCodenamesStore = create<CodenamesStore>((set, get) => ({
  ...createInitialRoundState(),

  startGame: (cards, teamAssignments, codemasters, startingTeam) => {
    const state = get();
    if (state.phase !== 'teamSetup') return wrongPhase(state.phase, 'teamSetup');
    if (!codemasters.red || !codemasters.blue) {
      return { success: false, error: 'Both teams need a Codemaster before starting' };
    }

    set({
      ...createInitialRoundState(),
      phase: 'codemasterReveal',
      cards,
      teamAssignments,
      codemasters,
      currentTeam: startingTeam,
    });
    return { success: true };
  },

  confirmCodemasterRevealSeen: () => {
    const state = get();
    if (state.phase !== 'codemasterReveal') return wrongPhase(state.phase, 'codemasterReveal');

    set({ phase: 'clueEntry' });
    return { success: true };
  },

  submitClue: (word, count) => {
    const state = get();
    if (state.phase !== 'clueEntry') return wrongPhase(state.phase, 'clueEntry');
    const trimmedWord = word.trim();
    if (trimmedWord.length === 0) return { success: false, error: 'Clue word cannot be empty' };
    if (!Number.isInteger(count) || count < 0) return { success: false, error: 'Guess count must be a non-negative integer' };

    set({
      phase: 'guessing',
      currentClue: { word: trimmedWord, count },
      guessesRemaining: count + 1,
    });
    return { success: true };
  },

  guessCard: (cardId) => {
    const state = get();
    if (state.phase !== 'guessing') return wrongPhase(state.phase, 'guessing');

    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return { success: false, error: `Unknown card "${cardId}"` };
    if (card.revealed) return { success: false, error: `Card "${cardId}" is already revealed` };

    const cards = state.cards.map((c) => (c.id === cardId ? { ...c, revealed: true } : c));
    const outcome = resolveAfterReveal(cards, card.owner, state.currentTeam, state.guessesRemaining);

    set({ cards, ...outcome });
    return { success: true };
  },

  endTurn: () => {
    const state = get();
    if (state.phase !== 'guessing') return wrongPhase(state.phase, 'guessing');

    set({ phase: 'turnEnd', guessesRemaining: 0 });
    return { success: true };
  },

  continueToNextTeam: () => {
    const state = get();
    if (state.phase !== 'turnEnd') return wrongPhase(state.phase, 'turnEnd');

    set({
      phase: 'codemasterReveal',
      currentTeam: otherTeam(state.currentTeam),
      currentClue: null,
      guessesRemaining: 0,
    });
    return { success: true };
  },

  playAgain: () => {
    const state = get();
    if (state.phase !== 'gameOver') return wrongPhase(state.phase, 'gameOver');

    set(createInitialRoundState());
    return { success: true };
  },

  reset: () => set(createInitialRoundState()),
}));
