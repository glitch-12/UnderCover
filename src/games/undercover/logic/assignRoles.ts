import { shuffle } from '../../../core/content/deck';
import type { Player, Role, RoleAssignment, WordPair } from '../../../core/types';
import type { UndercoverVariantConfig } from '../config';

function resolveUndercoverCount(playerCount: number, variant: UndercoverVariantConfig): number {
  const mrWhiteCount = variant.mrWhiteEnabled ? 1 : 0;
  // Always leave at least 1 Civilian, however the variant's formula is defined.
  const maxUndercover = Math.max(0, playerCount - mrWhiteCount - 1);
  return Math.min(Math.max(1, variant.undercoverCount(playerCount)), maxUndercover);
}

export function assignRoles(
  players: Player[],
  variant: UndercoverVariantConfig,
  wordPair: WordPair,
  rng: () => number = Math.random,
): RoleAssignment[] {
  const undercoverCount = resolveUndercoverCount(players.length, variant);
  const mrWhiteCount = variant.mrWhiteEnabled ? 1 : 0;

  const roles: Role[] = [
    ...Array<Role>(undercoverCount).fill('undercover'),
    ...Array<Role>(mrWhiteCount).fill('mrWhite'),
  ];
  while (roles.length < players.length) {
    roles.push('civilian');
  }

  const shuffledRoles = shuffle(roles, rng);

  return players.map((player, index) => {
    const role = shuffledRoles[index];
    const word = role === 'civilian' ? wordPair.civilianWord : role === 'undercover' ? wordPair.undercoverWord : null;
    return { playerId: player.id, role, word };
  });
}
