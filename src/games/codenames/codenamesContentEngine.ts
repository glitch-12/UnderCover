import { createDeck, reshuffle } from '../../core/content/deck';
import type { DeckState } from '../../core/content/deck';
import { mmkvStore } from '../../core/storage/mmkv';
import type { KeyValueStore } from '../../core/storage/mmkv';
import codenamesSeedEnRaw from '../../packs/codenames-seed-en.json';
import { CODENAMES_BOARD_SIZE } from './config';

export interface CodenamesWordPack {
  id: string;
  name: string;
  locale: string;
  version: number;
  words: string[];
}

export const codenamesSeedEnPack = codenamesSeedEnRaw as CodenamesWordPack;

interface PersistedDeckState {
  packId: string;
  packVersion: number;
  order: string[];
  cursor: number;
  recentHistory: string[];
}

export interface CodenamesContentEngineOptions {
  store?: KeyValueStore;
  rng?: () => number;
}

// Draws a fresh, non-repeating 25-word board per game (ARCHITECTURE.md §6.2's
// no-repeat deck model, applied to a flat word list instead of word pairs).
export class CodenamesContentEngine {
  private readonly pack: CodenamesWordPack;
  private readonly allWords: string[];
  private readonly store: KeyValueStore;
  private readonly storageKey: string;
  private readonly recentHistorySize: number;
  private readonly rng: () => number;
  private deck: DeckState;

  constructor(pack: CodenamesWordPack, options: CodenamesContentEngineOptions = {}) {
    if (pack.words.length < CODENAMES_BOARD_SIZE) {
      throw new Error(`CodenamesContentEngine: pack "${pack.id}" has fewer than ${CODENAMES_BOARD_SIZE} words`);
    }

    this.pack = pack;
    this.allWords = pack.words;
    this.store = options.store ?? mmkvStore;
    this.rng = options.rng ?? Math.random;
    this.storageKey = `codenames-content-engine:${pack.id}`;
    // Keep at least a full board's worth out of the "fresh" pool on reshuffle,
    // so a mid-hand reshuffle can never repeat a word already drawn for the
    // board currently being dealt.
    this.recentHistorySize = Math.max(CODENAMES_BOARD_SIZE, Math.ceil(pack.words.length * 0.2));
    this.deck = this.loadOrCreateDeck();
  }

  // Draws one board's words as a contiguous slice of the current shuffled
  // order, reshuffling first if too few cards remain — a slice of a
  // permutation can never contain a duplicate, so this guarantees 25 unique
  // words per board regardless of pack size (unlike drawing 25 single items
  // one at a time, which can straddle a reshuffle and repeat a word already
  // picked earlier in the same board).
  drawBoardWords(): string[] {
    let { order, cursor, recentHistory } = this.deck;

    if (order.length - cursor < CODENAMES_BOARD_SIZE) {
      order = reshuffle(this.allWords, recentHistory, this.rng);
      cursor = 0;
    }

    const board = order.slice(cursor, cursor + CODENAMES_BOARD_SIZE);
    cursor += CODENAMES_BOARD_SIZE;
    recentHistory = [...board].reverse().concat(recentHistory).slice(0, this.recentHistorySize);

    this.deck = { order, cursor, recentHistory };
    this.persist();
    return board;
  }

  private loadOrCreateDeck(): DeckState {
    const raw = this.store.getString(this.storageKey);
    if (raw) {
      const restored = this.tryRestoreDeck(raw);
      if (restored) return restored;
    }
    return createDeck(this.allWords, this.rng);
  }

  private tryRestoreDeck(raw: string): DeckState | null {
    let persisted: PersistedDeckState;
    try {
      persisted = JSON.parse(raw);
    } catch {
      return null;
    }

    if (persisted.packId !== this.pack.id || persisted.packVersion !== this.pack.version) {
      return null;
    }

    const knownWords = new Set(this.allWords);
    const order = persisted.order.filter((word) => knownWords.has(word));
    if (order.length !== this.allWords.length) {
      // Pack content changed shape since this was persisted; start fresh.
      return null;
    }

    return {
      order,
      cursor: Math.min(persisted.cursor, order.length),
      recentHistory: persisted.recentHistory.filter((word) => knownWords.has(word)),
    };
  }

  private persist(): void {
    const payload: PersistedDeckState = {
      packId: this.pack.id,
      packVersion: this.pack.version,
      order: this.deck.order,
      cursor: this.deck.cursor,
      recentHistory: this.deck.recentHistory,
    };
    this.store.set(this.storageKey, JSON.stringify(payload));
  }
}

export const codenamesContentEngine = new CodenamesContentEngine(codenamesSeedEnPack);
