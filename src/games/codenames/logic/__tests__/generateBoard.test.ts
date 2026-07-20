import { CODENAMES_BOARD_SIZE } from '../../config';
import { generateBoard } from '../generateBoard';

function makeWords(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `word-${i}`);
}

describe('generateBoard', () => {
  it('assigns 9 cards to the starting team and 8 to the other team', () => {
    const board = generateBoard(makeWords(CODENAMES_BOARD_SIZE), 'red');

    expect(board.filter((c) => c.owner === 'red')).toHaveLength(9);
    expect(board.filter((c) => c.owner === 'blue')).toHaveLength(8);
  });

  it('gives the other starting team 9 cards when blue starts', () => {
    const board = generateBoard(makeWords(CODENAMES_BOARD_SIZE), 'blue');

    expect(board.filter((c) => c.owner === 'blue')).toHaveLength(9);
    expect(board.filter((c) => c.owner === 'red')).toHaveLength(8);
  });

  it('assigns 7 neutral cards and exactly 1 assassin', () => {
    const board = generateBoard(makeWords(CODENAMES_BOARD_SIZE), 'red');

    expect(board.filter((c) => c.owner === 'neutral')).toHaveLength(7);
    expect(board.filter((c) => c.owner === 'assassin')).toHaveLength(1);
  });

  it('produces exactly 25 cards with no duplicate words and none revealed', () => {
    const words = makeWords(CODENAMES_BOARD_SIZE);
    const board = generateBoard(words, 'red');

    expect(board).toHaveLength(CODENAMES_BOARD_SIZE);
    expect(new Set(board.map((c) => c.word)).size).toBe(CODENAMES_BOARD_SIZE);
    expect(board.every((c) => c.revealed === false)).toBe(true);
  });

  it('throws if given a word list that is not exactly the board size', () => {
    expect(() => generateBoard(makeWords(24), 'red')).toThrow();
    expect(() => generateBoard(makeWords(26), 'red')).toThrow();
  });

  it('is deterministic given an injected rng', () => {
    const words = makeWords(CODENAMES_BOARD_SIZE);
    const constantRng = () => 0.5;

    const boardA = generateBoard(words, 'red', constantRng);
    const boardB = generateBoard(words, 'red', constantRng);

    expect(boardA.map((c) => c.owner)).toEqual(boardB.map((c) => c.owner));
  });
});
