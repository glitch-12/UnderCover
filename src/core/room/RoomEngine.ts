import { create } from 'zustand';
import type { Player } from '../types';

export interface RoomActionResult {
  success: boolean;
  error?: string;
}

interface RoomState {
  players: Player[];
}

interface RoomActions {
  addPlayer: (name: string, color: string, maxPlayers: number) => RoomActionResult;
  removePlayer: (playerId: string) => RoomActionResult;
  reorderPlayers: (fromIndex: number, toIndex: number) => RoomActionResult;
  reset: () => void;
}

export type RoomStore = RoomState & RoomActions;

let idCounter = 0;
function generatePlayerId(): string {
  idCounter += 1;
  return `player-${idCounter}`;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  players: [],

  addPlayer: (name, color, maxPlayers) => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return { success: false, error: 'Player name cannot be empty' };
    }
    if (get().players.length >= maxPlayers) {
      return { success: false, error: `Cannot add more than ${maxPlayers} players` };
    }

    const player: Player = {
      id: generatePlayerId(),
      name: trimmedName,
      color,
      isEliminated: false,
    };
    set((state) => ({ players: [...state.players, player] }));
    return { success: true };
  },

  removePlayer: (playerId) => {
    if (!get().players.some((p) => p.id === playerId)) {
      return { success: false, error: `Player "${playerId}" not found` };
    }
    set((state) => ({ players: state.players.filter((p) => p.id !== playerId) }));
    return { success: true };
  },

  reorderPlayers: (fromIndex, toIndex) => {
    const { players } = get();
    if (fromIndex < 0 || fromIndex >= players.length || toIndex < 0 || toIndex >= players.length) {
      return { success: false, error: 'Index out of bounds' };
    }

    const next = players.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    set({ players: next });
    return { success: true };
  },

  reset: () => set({ players: [] }),
}));

// Min/max player-count rules live on the active GameModule, not here — this
// just applies whatever bounds the caller passes in, so RoomEngine stays
// game-agnostic.
export function isRoomReadyForGame(players: Player[], minPlayers: number, maxPlayers: number): RoomActionResult {
  if (players.length < minPlayers) {
    return { success: false, error: `Need at least ${minPlayers} players (have ${players.length})` };
  }
  if (players.length > maxPlayers) {
    return { success: false, error: `Too many players (max ${maxPlayers})` };
  }
  return { success: true };
}
