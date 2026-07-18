import type { VariantConfig } from '../../../core/types';

export type UndercoverVariantId = 'classic' | 'mrWhite' | 'multiUndercover';

export interface UndercoverVariantConfig extends VariantConfig {
  id: UndercoverVariantId;
  mrWhiteEnabled: boolean;
  undercoverCount: (playerCount: number) => number;
}

export const UNDERCOVER_MIN_PLAYERS = 3;
export const UNDERCOVER_MAX_PLAYERS = 20;

export const undercoverVariants: UndercoverVariantConfig[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: '1 Undercover, everyone else is a Civilian.',
    mrWhiteEnabled: false,
    undercoverCount: () => 1,
  },
  {
    id: 'mrWhite',
    name: 'Mr. White',
    description: 'Adds a player with a blank word who can steal the win by guessing the Civilian word.',
    mrWhiteEnabled: true,
    undercoverCount: () => 1,
  },
  {
    id: 'multiUndercover',
    name: 'Multi-Undercover',
    description: 'The number of Undercover players scales with the table size.',
    mrWhiteEnabled: false,
    undercoverCount: (playerCount) => Math.floor(playerCount / 4),
  },
];

export function getUndercoverVariant(id: UndercoverVariantId): UndercoverVariantConfig {
  const variant = undercoverVariants.find((v) => v.id === id);
  if (!variant) {
    throw new Error(`Unknown Undercover variant "${id}"`);
  }
  return variant;
}
