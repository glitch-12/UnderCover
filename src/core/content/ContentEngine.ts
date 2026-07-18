import type { WordPack, WordPair } from '../types';
import type { KeyValueStore } from '../storage/mmkv';
import { mmkvStore } from '../storage/mmkv';
import { createDeck, drawFromDeck, DeckState } from './deck';

const RECENT_HISTORY_RATIO = 0.2;

interface PersistedDeckState {
  packId: string;
  packVersion: number;
  order: string[];
  cursor: number;
  recentHistory: string[];
}

export interface ContentEngineOptions {
  store?: KeyValueStore;
  rng?: () => number;
}

export class ContentEngine {
  private readonly pack: WordPack;
  private readonly pairsById: Map<string, WordPair>;
  private readonly allIds: string[];
  private readonly store: KeyValueStore;
  private readonly storageKey: string;
  private readonly recentHistorySize: number;
  private readonly rng: () => number;
  private deck: DeckState;

  constructor(pack: WordPack, options: ContentEngineOptions = {}) {
    this.pack = pack;
    this.pairsById = new Map(pack.pairs.map((pair) => [pair.id, pair]));
    this.allIds = pack.pairs.map((pair) => pair.id);
    this.store = options.store ?? mmkvStore;
    this.rng = options.rng ?? Math.random;
    this.storageKey = `content-engine:${pack.id}`;
    this.recentHistorySize = Math.max(1, Math.ceil(pack.pairs.length * RECENT_HISTORY_RATIO));
    this.deck = this.loadOrCreateDeck();
  }

  drawPair(): WordPair {
    const { id, deck } = drawFromDeck(this.deck, this.allIds, this.recentHistorySize, this.rng);
    this.deck = deck;
    this.persist();

    const pair = this.pairsById.get(id);
    if (!pair) {
      throw new Error(`ContentEngine: drew unknown pair id "${id}"`);
    }
    return pair;
  }

  private loadOrCreateDeck(): DeckState {
    const raw = this.store.getString(this.storageKey);
    if (raw) {
      const restored = this.tryRestoreDeck(raw);
      if (restored) return restored;
    }
    return createDeck(this.allIds, this.rng);
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

    const knownIds = new Set(this.allIds);
    const order = persisted.order.filter((id) => knownIds.has(id));
    if (order.length !== this.allIds.length) {
      // Pack content changed shape since this was persisted; start fresh.
      return null;
    }

    return {
      order,
      cursor: Math.min(persisted.cursor, order.length),
      recentHistory: persisted.recentHistory.filter((id) => knownIds.has(id)),
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
