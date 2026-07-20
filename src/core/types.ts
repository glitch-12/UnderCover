// Shared platform types (ARCHITECTURE.md §4, §8). Game-agnostic — no Undercover-specific fields here.

export type Role = 'civilian' | 'undercover' | 'mrWhite';

export interface Player {
  id: string;
  name: string;
  color: string;
}

export interface WordPair {
  id: string;
  civilianWord: string;
  undercoverWord: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export interface WordPack {
  id: string;
  name: string;
  locale: string;
  version: number;
  pairs: WordPair[];
}

export interface VariantConfig {
  id: string;
  name: string;
  description: string;
}

export interface RoleAssignment {
  playerId: string;
  role: Role;
  word: string | null;
}

export type RoundPhase =
  | 'lobby'
  | 'roleAssignment'
  | 'clueTurn'
  | 'discussion'
  | 'vote'
  | 'elimination'
  | 'mrWhiteGuess'
  | 'winCheck'
  | 'gameOver';

export interface RoundState {
  phase: RoundPhase;
  roundNumber: number;
  roleAssignments: RoleAssignment[];
  turnOrder: string[];
  currentTurnPlayerId: string | null;
  eliminatedPlayerIds: string[];
  winner: 'civilians' | 'undercover' | 'mrWhite' | null;
}
