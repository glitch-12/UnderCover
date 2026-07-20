import type { CodenamesTeam } from '../config';
import type { CodenamesCard } from './generateBoard';

// A team wins as soon as every card they own has been revealed. The
// assassin's instant-loss is handled where a card gets revealed (the store),
// not here — this only checks the "found all your cards" win path.
export function checkBoardWinner(cards: CodenamesCard[]): CodenamesTeam | null {
  const hasUnrevealedFor = (team: CodenamesTeam) => cards.some((card) => card.owner === team && !card.revealed);

  if (!hasUnrevealedFor('red')) return 'red';
  if (!hasUnrevealedFor('blue')) return 'blue';
  return null;
}
