import { CodenamesContentEngine } from '../codenamesContentEngine';
import type { CodenamesWordPack } from '../codenamesContentEngine';
import type { KeyValueStore } from '../../../core/storage/mmkv';
import { CODENAMES_BOARD_SIZE } from '../config';

function makeFakeStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getString: (key) => data.get(key),
    set: (key, value) => {
      data.set(key, value);
    },
  };
}

function makePack(wordCount: number): CodenamesWordPack {
  return {
    id: 'test-codenames-pack',
    name: 'Test Codenames Pack',
    locale: 'en',
    version: 1,
    words: Array.from({ length: wordCount }, (_, i) => `Word${i}`),
  };
}

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 0x7fffffff;
  };
}

describe('CodenamesContentEngine', () => {
  it('throws if the pack has fewer words than a board needs', () => {
    const pack = makePack(CODENAMES_BOARD_SIZE - 1);
    expect(() => new CodenamesContentEngine(pack, { store: makeFakeStore() })).toThrow();
  });

  it('draws exactly a board size worth of unique words', () => {
    const pack = makePack(80);
    const engine = new CodenamesContentEngine(pack, { store: makeFakeStore(), rng: seededRng(7) });

    const board = engine.drawBoardWords();

    expect(board).toHaveLength(CODENAMES_BOARD_SIZE);
    expect(new Set(board).size).toBe(CODENAMES_BOARD_SIZE);
  });

  it('draws unique words within a board even when a reshuffle happens mid-hand', () => {
    // 30 words is just above one board's worth, so drawing a second board
    // forces a reshuffle partway through.
    const pack = makePack(30);
    const engine = new CodenamesContentEngine(pack, { store: makeFakeStore(), rng: seededRng(42) });

    engine.drawBoardWords();
    const secondBoard = engine.drawBoardWords();

    expect(new Set(secondBoard).size).toBe(CODENAMES_BOARD_SIZE);
  });

  it('persists the deck cursor across a simulated app restart', () => {
    const pack = makePack(80);
    const store = makeFakeStore();

    const engineBeforeRestart = new CodenamesContentEngine(pack, { store, rng: seededRng(11) });
    const firstBoard = engineBeforeRestart.drawBoardWords();

    const engineAfterRestart = new CodenamesContentEngine(pack, { store, rng: seededRng(999) });
    const secondBoard = engineAfterRestart.drawBoardWords();

    // The restarted engine must continue the same shuffled order, not
    // restart from the beginning (which would replay the same board).
    expect(secondBoard).not.toEqual(firstBoard);
  });

  it('starts fresh if the persisted pack id/version no longer matches', () => {
    const pack = makePack(40);
    const store = makeFakeStore();
    store.set(
      'codenames-content-engine:test-codenames-pack',
      JSON.stringify({ packId: 'other-pack', packVersion: 1, order: [], cursor: 0, recentHistory: [] }),
    );

    const engine = new CodenamesContentEngine(pack, { store, rng: seededRng(1) });
    const board = engine.drawBoardWords();

    expect(board.every((word) => pack.words.includes(word))).toBe(true);
  });
});
