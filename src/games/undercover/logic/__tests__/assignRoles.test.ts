import { assignRoles } from '../assignRoles';
import { undercoverVariants, UNDERCOVER_MAX_PLAYERS, UNDERCOVER_MIN_PLAYERS } from '../../config';
import type { UndercoverVariantConfig } from '../../config';
import type { Player, WordPair } from '../../../../core/types';

const wordPair: WordPair = {
  id: 'coffee-tea',
  civilianWord: 'Coffee',
  undercoverWord: 'Tea',
  category: 'Food',
  difficulty: 'hard',
};

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    color: '#000',
    isEliminated: false,
  }));
}

function variant(id: UndercoverVariantConfig['id']): UndercoverVariantConfig {
  const v = undercoverVariants.find((x) => x.id === id);
  if (!v) throw new Error('missing variant fixture');
  return v;
}

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

const playerCounts = Array.from(
  { length: UNDERCOVER_MAX_PLAYERS - UNDERCOVER_MIN_PLAYERS + 1 },
  (_, i) => UNDERCOVER_MIN_PLAYERS + i,
);

describe('assignRoles — role counts across 3-20 players', () => {
  describe.each(playerCounts)('with %i players', (playerCount) => {
    it('classic: exactly 1 undercover, no Mr. White, rest civilians', () => {
      const players = makePlayers(playerCount);
      const roles = assignRoles(players, variant('classic'), wordPair);

      expect(roles).toHaveLength(playerCount);
      expect(roles.filter((r) => r.role === 'undercover')).toHaveLength(1);
      expect(roles.filter((r) => r.role === 'mrWhite')).toHaveLength(0);
      expect(roles.filter((r) => r.role === 'civilian')).toHaveLength(playerCount - 1);
    });

    it('mrWhite: exactly 1 undercover and 1 Mr. White, rest civilians', () => {
      const players = makePlayers(playerCount);
      const roles = assignRoles(players, variant('mrWhite'), wordPair);

      expect(roles).toHaveLength(playerCount);
      expect(roles.filter((r) => r.role === 'undercover')).toHaveLength(1);
      expect(roles.filter((r) => r.role === 'mrWhite')).toHaveLength(1);
      expect(roles.filter((r) => r.role === 'civilian')).toHaveLength(playerCount - 2);
    });

    it('multiUndercover: undercover count scales as max(1, floor(playerCount/4)), no Mr. White', () => {
      const players = makePlayers(playerCount);
      const roles = assignRoles(players, variant('multiUndercover'), wordPair);
      const expectedUndercover = Math.max(1, Math.floor(playerCount / 4));

      expect(roles).toHaveLength(playerCount);
      expect(roles.filter((r) => r.role === 'undercover')).toHaveLength(expectedUndercover);
      expect(roles.filter((r) => r.role === 'mrWhite')).toHaveLength(0);
      expect(roles.filter((r) => r.role === 'civilian')).toHaveLength(playerCount - expectedUndercover);
    });
  });
});

describe('assignRoles — assignment correctness', () => {
  it('assigns exactly one role per input player, covering every player id', () => {
    const players = makePlayers(6);
    const roles = assignRoles(players, variant('mrWhite'), wordPair);

    expect(new Set(roles.map((r) => r.playerId))).toEqual(new Set(players.map((p) => p.id)));
  });

  it('gives civilians the civilian word, undercover the undercover word, and Mr. White no word', () => {
    const players = makePlayers(6);
    const roles = assignRoles(players, variant('mrWhite'), wordPair);

    for (const assignment of roles) {
      if (assignment.role === 'civilian') expect(assignment.word).toBe('Coffee');
      if (assignment.role === 'undercover') expect(assignment.word).toBe('Tea');
      if (assignment.role === 'mrWhite') expect(assignment.word).toBeNull();
    }
  });

  it('shuffles role order rather than always assigning the same player the same role', () => {
    const players = makePlayers(10);
    const rolesForPlayer0 = new Set<string>();

    // Deterministic seeded RNGs (not Math.random) so this can't flake: each
    // seed below is fixed, and together they're known to land player 0 on
    // both a civilian and an undercover role at least once.
    for (let seed = 1; seed <= 20; seed += 1) {
      const roles = assignRoles(players, variant('classic'), wordPair, seededRng(seed));
      const player0Role = roles.find((r) => r.playerId === 'p0')?.role;
      if (player0Role) rolesForPlayer0.add(player0Role);
    }

    // Across enough seeds, player 0 should have been undercover at least once
    // as well as civilian at least once — proves roles aren't positional.
    expect(rolesForPlayer0.size).toBeGreaterThan(1);
  });
});
