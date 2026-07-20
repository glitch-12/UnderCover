import { useCodenamesStore } from '../codenamesStore';
import type { CardOwner, CodenamesCard } from '../logic/generateBoard';

beforeEach(() => {
  useCodenamesStore.getState().reset();
});

const CODEMASTERS = { red: 'red-cm', blue: 'blue-cm' };
const TEAM_ASSIGNMENTS = { 'red-cm': 'red' as const, 'blue-cm': 'blue' as const, guesser1: 'red' as const, guesser2: 'blue' as const };

function card(id: string, owner: CardOwner): CodenamesCard {
  return { id, word: id, owner, revealed: false };
}

// Board with 2 red, 2 blue, 2 neutral, 1 assassin — small and fully
// controlled so tests can target exact cards instead of relying on randomness.
function makeBoard(): CodenamesCard[] {
  return [
    card('red-1', 'red'),
    card('red-2', 'red'),
    card('blue-1', 'blue'),
    card('blue-2', 'blue'),
    card('neutral-1', 'neutral'),
    card('neutral-2', 'neutral'),
    card('assassin-1', 'assassin'),
  ];
}

function startGame() {
  useCodenamesStore.getState().startGame(makeBoard(), TEAM_ASSIGNMENTS, CODEMASTERS, 'red');
  useCodenamesStore.getState().confirmCodemasterRevealSeen();
}

describe('CodenamesStore — turn flow', () => {
  it('walks a correct-then-wrong guess through clue entry, guessing, and turn handoff', () => {
    startGame();
    expect(useCodenamesStore.getState().phase).toBe('clueEntry');

    expect(useCodenamesStore.getState().submitClue('animals', 2)).toEqual({ success: true });
    expect(useCodenamesStore.getState()).toMatchObject({ phase: 'guessing', guessesRemaining: 3 });

    // Correct guess: stays in guessing, one fewer guess remaining.
    expect(useCodenamesStore.getState().guessCard('red-1')).toEqual({ success: true });
    expect(useCodenamesStore.getState()).toMatchObject({ phase: 'guessing', guessesRemaining: 2 });

    // Wrong guess (neutral card): turn ends immediately even with guesses left.
    expect(useCodenamesStore.getState().guessCard('neutral-1')).toEqual({ success: true });
    expect(useCodenamesStore.getState()).toMatchObject({ phase: 'turnEnd', guessesRemaining: 0 });

    expect(useCodenamesStore.getState().continueToNextTeam()).toEqual({ success: true });
    expect(useCodenamesStore.getState()).toMatchObject({ phase: 'codemasterReveal', currentTeam: 'blue', currentClue: null });
  });

  it('ends the turn once guesses run out on all-correct guesses', () => {
    startGame();
    useCodenamesStore.getState().submitClue('animals', 1); // guessesRemaining = 2

    useCodenamesStore.getState().guessCard('red-1');
    expect(useCodenamesStore.getState().phase).toBe('guessing');

    useCodenamesStore.getState().guessCard('red-2');
    expect(useCodenamesStore.getState()).toMatchObject({ phase: 'gameOver', winner: 'red' });
  });

  it('lets a team pass early via endTurn', () => {
    startGame();
    useCodenamesStore.getState().submitClue('animals', 3);
    useCodenamesStore.getState().guessCard('red-1');

    expect(useCodenamesStore.getState().endTurn()).toEqual({ success: true });
    expect(useCodenamesStore.getState().phase).toBe('turnEnd');
  });
});

describe('CodenamesStore — win conditions', () => {
  it('wins the game for a team once all their cards are revealed', () => {
    startGame();
    useCodenamesStore.getState().submitClue('animals', 5);

    useCodenamesStore.getState().guessCard('red-1');
    useCodenamesStore.getState().guessCard('red-2');

    expect(useCodenamesStore.getState()).toMatchObject({ phase: 'gameOver', winner: 'red' });
  });

  it('ends the game instantly for the other team if the assassin is guessed', () => {
    startGame();
    useCodenamesStore.getState().submitClue('animals', 5);

    expect(useCodenamesStore.getState().guessCard('assassin-1')).toEqual({ success: true });
    expect(useCodenamesStore.getState()).toMatchObject({ phase: 'gameOver', winner: 'blue' });
  });

  it('resets round-specific state on playAgain', () => {
    startGame();
    useCodenamesStore.getState().submitClue('animals', 5);
    useCodenamesStore.getState().guessCard('assassin-1');

    expect(useCodenamesStore.getState().playAgain()).toEqual({ success: true });
    expect(useCodenamesStore.getState()).toMatchObject({
      phase: 'teamSetup',
      cards: [],
      currentTeam: 'red',
      currentClue: null,
      guessesRemaining: 0,
      winner: null,
    });
  });
});

describe('CodenamesStore — validation and phase guards', () => {
  it('rejects starting a game unless both teams have a Codemaster', () => {
    const result = useCodenamesStore
      .getState()
      .startGame(makeBoard(), TEAM_ASSIGNMENTS, { red: 'red-cm', blue: null }, 'red');
    expect(result.success).toBe(false);
    expect(useCodenamesStore.getState().phase).toBe('teamSetup');
  });

  it('rejects an empty clue word', () => {
    startGame();
    const result = useCodenamesStore.getState().submitClue('   ', 2);
    expect(result.success).toBe(false);
    expect(useCodenamesStore.getState().phase).toBe('clueEntry');
  });

  it('rejects a negative or non-integer guess count', () => {
    startGame();
    expect(useCodenamesStore.getState().submitClue('animals', -1).success).toBe(false);
    expect(useCodenamesStore.getState().submitClue('animals', 1.5).success).toBe(false);
  });

  it('rejects guessing a card that is already revealed', () => {
    startGame();
    useCodenamesStore.getState().submitClue('animals', 5);
    useCodenamesStore.getState().guessCard('red-1');

    const result = useCodenamesStore.getState().guessCard('red-1');
    expect(result.success).toBe(false);
  });

  it('rejects actions called from the wrong phase and leaves state unchanged', () => {
    expect(useCodenamesStore.getState().submitClue('animals', 2)).toMatchObject({ success: false });
    expect(useCodenamesStore.getState().guessCard('red-1')).toMatchObject({ success: false });
    expect(useCodenamesStore.getState().endTurn()).toMatchObject({ success: false });
    expect(useCodenamesStore.getState().continueToNextTeam()).toMatchObject({ success: false });
    expect(useCodenamesStore.getState().playAgain()).toMatchObject({ success: false });
    expect(useCodenamesStore.getState().phase).toBe('teamSetup');
  });
});
