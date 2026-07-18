import { createDeck, drawFromDeck } from '../deck';

function makeIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `pair-${i}`);
}

// Deterministic seeded PRNG so shuffles are reproducible across test runs.
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 0x7fffffff;
  };
}

describe('createDeck', () => {
  it('includes every id exactly once, in some order', () => {
    const ids = makeIds(20);
    const deck = createDeck(ids, seededRng(1));
    expect(deck.order).toHaveLength(ids.length);
    expect(new Set(deck.order)).toEqual(new Set(ids));
    expect(deck.cursor).toBe(0);
    expect(deck.recentHistory).toEqual([]);
  });
});

describe('drawFromDeck', () => {
  it('draws every pair exactly once before repeating, across a full exhaustion + reshuffle cycle', () => {
    const ids = makeIds(30);
    const recentHistorySize = Math.ceil(ids.length * 0.2);
    const rng = seededRng(42);

    let deck = createDeck(ids, rng);
    const drawnFirstPass: string[] = [];
    for (let i = 0; i < ids.length; i += 1) {
      const result = drawFromDeck(deck, ids, recentHistorySize, rng);
      drawnFirstPass.push(result.id);
      deck = result.deck;
    }

    // First full pass covers every id exactly once.
    expect(new Set(drawnFirstPass)).toEqual(new Set(ids));
    expect(drawnFirstPass).toHaveLength(ids.length);

    // Drawing once more triggers a reshuffle (deck exhausted).
    const { id: firstOfSecondPass, deck: deckAfterReshuffle } = drawFromDeck(deck, ids, recentHistorySize, rng);
    deck = deckAfterReshuffle;

    // The reshuffle must not put any of the last N drawn ids at the front.
    const lastNDrawn = drawnFirstPass.slice(-recentHistorySize);
    expect(lastNDrawn).not.toContain(firstOfSecondPass);
  });

  it('never draws the same pair twice in a row, even across many reshuffles', () => {
    const ids = makeIds(10);
    const recentHistorySize = Math.ceil(ids.length * 0.2);
    const rng = seededRng(7);

    let deck = createDeck(ids, rng);
    let previous: string | null = null;

    for (let i = 0; i < ids.length * 25; i += 1) {
      const result = drawFromDeck(deck, ids, recentHistorySize, rng);
      expect(result.id).not.toBe(previous);
      previous = result.id;
      deck = result.deck;
    }
  });

  it('does not mutate the deck state passed in', () => {
    const ids = makeIds(5);
    const rng = seededRng(3);
    const deck = createDeck(ids, rng);
    const snapshot = JSON.parse(JSON.stringify(deck));

    drawFromDeck(deck, ids, 1, rng);

    expect(deck).toEqual(snapshot);
  });
});
