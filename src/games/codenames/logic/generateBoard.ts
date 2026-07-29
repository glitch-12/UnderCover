import { shuffle } from '../../../core/content/deck';
import type { CodenamesTeam } from '../config';
import {
  CODENAMES_ASSASSIN_CARD_COUNT,
  CODENAMES_BOARD_SIZE,
  CODENAMES_NEUTRAL_CARD_COUNT,
  CODENAMES_SECOND_TEAM_CARD_COUNT,
  CODENAMES_STARTING_TEAM_CARD_COUNT,
} from '../config';

export type CardOwner = CodenamesTeam | 'neutral' | 'assassin';

export interface CodenamesCard {
  id: string;
  word: string;
  owner: CardOwner;
  revealed: boolean;
}

function otherTeam(team: CodenamesTeam): CodenamesTeam {
  return team === 'red' ? 'blue' : 'red';
}

// Builds a shuffled 25-card board: the starting team gets 9 cards, the other
// team 8, 7 neutral, and 1 assassin (ARCHITECTURE.md-style classic ratio).
export function generateBoard(words: string[], startingTeam: CodenamesTeam, rng: () => number = Math.random): CodenamesCard[] {
  if (words.length !== CODENAMES_BOARD_SIZE) {
    throw new Error(`generateBoard expects exactly ${CODENAMES_BOARD_SIZE} words, got ${words.length}`);
  }

  const owners: CardOwner[] = [
    ...Array<CardOwner>(CODENAMES_STARTING_TEAM_CARD_COUNT).fill(startingTeam),
    ...Array<CardOwner>(CODENAMES_SECOND_TEAM_CARD_COUNT).fill(otherTeam(startingTeam)),
    ...Array<CardOwner>(CODENAMES_NEUTRAL_CARD_COUNT).fill('neutral'),
    ...Array<CardOwner>(CODENAMES_ASSASSIN_CARD_COUNT).fill('assassin'),
  ];
  const shuffledOwners = shuffle(owners, rng);

  return words.map((word, index) => ({
    id: `card-${index}`,
    word,
    owner: shuffledOwners[index],
    revealed: false,
  }));
}
