import { create } from 'zustand';
import type { RoleAssignment, RoundState } from '../types';

export interface TurnActionResult {
  success: boolean;
  error?: string;
}

interface TurnActions {
  startGame: (roleAssignments: RoleAssignment[], turnOrder: string[]) => TurnActionResult;
  confirmRoleAssignmentComplete: () => TurnActionResult;
  advanceClueTurn: () => TurnActionResult;
  startVote: () => TurnActionResult;
  eliminatePlayer: (playerId: string) => TurnActionResult;
  continueAfterElimination: () => TurnActionResult;
  resolveMrWhiteGuess: (correct: boolean) => TurnActionResult;
  resolveWinCheck: (winner: RoundState['winner']) => TurnActionResult;
  playAgain: () => TurnActionResult;
  reset: () => void;
}

export type TurnStore = RoundState & TurnActions;

function createInitialRoundState(): RoundState {
  return {
    phase: 'lobby',
    roundNumber: 0,
    roleAssignments: [],
    turnOrder: [],
    currentTurnPlayerId: null,
    eliminatedPlayerIds: [],
    winner: null,
  };
}

function activePlayerOrder(turnOrder: string[], eliminatedPlayerIds: string[]): string[] {
  const eliminated = new Set(eliminatedPlayerIds);
  return turnOrder.filter((id) => !eliminated.has(id));
}

function wrongPhase(actual: RoundState['phase'], expected: RoundState['phase']): TurnActionResult {
  return { success: false, error: `Cannot do this from phase "${actual}" (expected "${expected}")` };
}

export const useTurnStore = create<TurnStore>((set, get) => ({
  ...createInitialRoundState(),

  startGame: (roleAssignments, turnOrder) => {
    const state = get();
    if (state.phase !== 'lobby') return wrongPhase(state.phase, 'lobby');
    if (turnOrder.length === 0) return { success: false, error: 'turnOrder must not be empty' };

    set({
      ...createInitialRoundState(),
      phase: 'roleAssignment',
      roleAssignments,
      turnOrder,
    });
    return { success: true };
  },

  confirmRoleAssignmentComplete: () => {
    const state = get();
    if (state.phase !== 'roleAssignment') return wrongPhase(state.phase, 'roleAssignment');

    const active = activePlayerOrder(state.turnOrder, state.eliminatedPlayerIds);
    if (active.length === 0) return { success: false, error: 'No players to take a turn' };

    set({ phase: 'clueTurn', roundNumber: 1, currentTurnPlayerId: active[0] });
    return { success: true };
  },

  advanceClueTurn: () => {
    const state = get();
    if (state.phase !== 'clueTurn') return wrongPhase(state.phase, 'clueTurn');

    const active = activePlayerOrder(state.turnOrder, state.eliminatedPlayerIds);
    const currentIndex = active.indexOf(state.currentTurnPlayerId ?? '');
    const isLastPlayer = currentIndex === -1 || currentIndex === active.length - 1;

    if (isLastPlayer) {
      set({ phase: 'discussion', currentTurnPlayerId: null });
    } else {
      set({ currentTurnPlayerId: active[currentIndex + 1] });
    }
    return { success: true };
  },

  startVote: () => {
    const state = get();
    if (state.phase !== 'discussion') return wrongPhase(state.phase, 'discussion');

    set({ phase: 'vote' });
    return { success: true };
  },

  eliminatePlayer: (playerId) => {
    const state = get();
    if (state.phase !== 'vote') return wrongPhase(state.phase, 'vote');
    if (!state.roleAssignments.some((a) => a.playerId === playerId)) {
      return { success: false, error: `Unknown player "${playerId}"` };
    }

    set({ phase: 'elimination', eliminatedPlayerIds: [...state.eliminatedPlayerIds, playerId] });
    return { success: true };
  },

  continueAfterElimination: () => {
    const state = get();
    if (state.phase !== 'elimination') return wrongPhase(state.phase, 'elimination');

    const justEliminatedId = state.eliminatedPlayerIds[state.eliminatedPlayerIds.length - 1];
    const justEliminated = state.roleAssignments.find((a) => a.playerId === justEliminatedId);

    set({ phase: justEliminated?.role === 'mrWhite' ? 'mrWhiteGuess' : 'winCheck' });
    return { success: true };
  },

  resolveMrWhiteGuess: (correct) => {
    const state = get();
    if (state.phase !== 'mrWhiteGuess') return wrongPhase(state.phase, 'mrWhiteGuess');

    if (correct) {
      set({ phase: 'gameOver', winner: 'mrWhite' });
    } else {
      set({ phase: 'winCheck' });
    }
    return { success: true };
  },

  resolveWinCheck: (winner) => {
    const state = get();
    if (state.phase !== 'winCheck') return wrongPhase(state.phase, 'winCheck');

    if (winner) {
      set({ phase: 'gameOver', winner });
      return { success: true };
    }

    const active = activePlayerOrder(state.turnOrder, state.eliminatedPlayerIds);
    if (active.length === 0) {
      return { success: false, error: 'No players remain but no winner was reported' };
    }

    set({ phase: 'clueTurn', roundNumber: state.roundNumber + 1, currentTurnPlayerId: active[0] });
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
