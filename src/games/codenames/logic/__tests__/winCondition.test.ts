import type { CodenamesCard } from '../generateBoard';
import { checkBoardWinner } from '../winCondition';

function card(owner: CodenamesCard['owner'], revealed: boolean): CodenamesCard {
  return { id: `${owner}-${Math.random()}`, word: 'x', owner, revealed };
}

describe('checkBoardWinner', () => {
  it('returns null while both teams still have unrevealed cards', () => {
    const cards = [card('red', false), card('blue', false), card('neutral', true)];
    expect(checkBoardWinner(cards)).toBeNull();
  });

  it('returns "red" once every red card is revealed', () => {
    const cards = [card('red', true), card('red', true), card('blue', false), card('neutral', false)];
    expect(checkBoardWinner(cards)).toBe('red');
  });

  it('returns "blue" once every blue card is revealed', () => {
    const cards = [card('blue', true), card('red', false), card('assassin', false)];
    expect(checkBoardWinner(cards)).toBe('blue');
  });

  it('treats a team with zero cards as already having none unrevealed', () => {
    // Defensive case: shouldn't happen with a real 25-card board, but the
    // function should still behave sensibly if it ever does.
    const cards = [card('blue', false), card('neutral', false)];
    expect(checkBoardWinner(cards)).toBe('red');
  });
});
