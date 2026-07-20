import { codenamesContentEngine } from './codenamesContentEngine';
import type { CodenamesTeam } from './config';
import { useCodenamesStore } from './codenamesStore';
import { generateBoard } from './logic/generateBoard';

// Draws a fresh 25-word board, assigns card owners, and starts the round.
// Shared by TeamSetup's "Start Game" and GameOver's "Play Again" so both go
// through the identical draw/generate path.
export function startCodenamesRound(
  teamAssignments: Record<string, CodenamesTeam>,
  codemasters: Record<CodenamesTeam, string | null>,
  startingTeam: CodenamesTeam,
): void {
  const words = codenamesContentEngine.drawBoardWords();
  const cards = generateBoard(words, startingTeam);

  useCodenamesStore.getState().startGame(cards, teamAssignments, codemasters, startingTeam);
}
