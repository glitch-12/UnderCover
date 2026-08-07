// No-repeat "deck" model for drawing word pairs (ARCHITECTURE.md §6.2).
// Shuffle once, draw sequentially without replacement, reshuffle on exhaustion
// while keeping recently-drawn ids out of the front of the new shuffle.

export interface DeckState {
  order: string[];
  cursor: number;
  recentHistory: string[];
}

export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function reshuffle(allIds: readonly string[], recentHistory: readonly string[], rng: () => number): string[] {
  const recentSet = new Set(recentHistory);
  const fresh = allIds.filter((id) => !recentSet.has(id));
  const recent = allIds.filter((id) => recentSet.has(id));
  // Recently-drawn ids are shuffled but appended after the fresh ones, so
  // they can't land at the front of the new order and repeat immediately.
  return [...shuffle(fresh, rng), ...shuffle(recent, rng)];
}

export function createDeck(allIds: readonly string[], rng: () => number = Math.random): DeckState {
  return { order: shuffle(allIds, rng), cursor: 0, recentHistory: [] };
}

export function drawFromDeck(
  deck: DeckState,
  allIds: readonly string[],
  recentHistorySize: number,
  rng: () => number = Math.random,
): { id: string; deck: DeckState } {
  let { order, cursor } = deck;
  const { recentHistory } = deck;

  if (order.length === 0 || cursor >= order.length) {
    order = reshuffle(allIds, recentHistory, rng);
    cursor = 0;
  }

  const id = order[cursor];
  const nextRecentHistory = [id, ...recentHistory].slice(0, recentHistorySize);

  return {
    id,
    deck: { order, cursor: cursor + 1, recentHistory: nextRecentHistory },
  };
}
