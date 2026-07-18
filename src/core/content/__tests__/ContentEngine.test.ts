import { ContentEngine } from '../ContentEngine';
import type { KeyValueStore } from '../../storage/mmkv';
import type { WordPack } from '../../types';

function makeFakeStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getString: (key) => data.get(key),
    set: (key, value) => {
      data.set(key, value);
    },
  };
}

function makePack(pairCount: number): WordPack {
  return {
    id: 'test-pack',
    name: 'Test Pack',
    locale: 'en',
    version: 1,
    pairs: Array.from({ length: pairCount }, (_, i) => ({
      id: `pair-${i}`,
      civilianWord: `Civilian${i}`,
      undercoverWord: `Undercover${i}`,
      category: 'Test',
      difficulty: 'medium' as const,
    })),
  };
}

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 0x7fffffff;
  };
}

describe('ContentEngine', () => {
  it('never returns the same pair twice in a row, even across reshuffles', () => {
    const pack = makePack(10);
    const engine = new ContentEngine(pack, { store: makeFakeStore(), rng: seededRng(99) });

    let previousId: string | null = null;
    for (let i = 0; i < pack.pairs.length * 20; i += 1) {
      const drawn = engine.drawPair();
      expect(drawn.id).not.toBe(previousId);
      previousId = drawn.id;
    }
  });

  it('draws every pair exactly once across a full pass', () => {
    const pack = makePack(15);
    const engine = new ContentEngine(pack, { store: makeFakeStore(), rng: seededRng(5) });

    const drawnIds = new Set<string>();
    for (let i = 0; i < pack.pairs.length; i += 1) {
      drawnIds.add(engine.drawPair().id);
    }

    expect(drawnIds.size).toBe(pack.pairs.length);
  });

  it('persists the deck cursor and recent history across a simulated app restart', () => {
    const pack = makePack(12);
    const store = makeFakeStore();

    const engineBeforeRestart = new ContentEngine(pack, { store, rng: seededRng(11) });
    const drawnBeforeRestart = [engineBeforeRestart.drawPair().id, engineBeforeRestart.drawPair().id, engineBeforeRestart.drawPair().id];

    // Simulate an app restart: a brand new ContentEngine instance backed by
    // the same underlying storage (as MMKV would be on disk).
    const engineAfterRestart = new ContentEngine(pack, { store, rng: seededRng(999) });
    const nextDraw = engineAfterRestart.drawPair();

    // The restarted engine must continue the same shuffled order, not
    // restart from the beginning (which would replay already-seen pairs).
    expect(drawnBeforeRestart).not.toContain(nextDraw.id);
  });

  it('starts fresh if the persisted pack id/version no longer matches', () => {
    const pack = makePack(8);
    const store = makeFakeStore();
    store.set('content-engine:test-pack', JSON.stringify({ packId: 'other-pack', packVersion: 1, order: [], cursor: 0, recentHistory: [] }));

    const engine = new ContentEngine(pack, { store, rng: seededRng(1) });
    const drawn = engine.drawPair();

    expect(pack.pairs.map((p) => p.id)).toContain(drawn.id);
  });
});
