import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { shuffle } from '../../core/content';
import { useRoomStore } from '../../core/room';
import { useTurnStore } from '../../core/turn';
import { undercoverContentEngine } from './contentEngine';
import { getUndercoverVariant } from './config';
import type { UndercoverVariantId } from './config';
import { assignRoles, checkWinner } from './logic';
import type { UndercoverStackParamList } from './UndercoverNavigator';

export type UndercoverNavigation = NativeStackNavigationProp<UndercoverStackParamList, keyof UndercoverStackParamList>;

// Draws a fresh word pair, assigns roles, shuffles turn order, and pushes
// the round into TurnEngine. Shared by Lobby's "Start Game" and GameOver's
// "Play Again" so both go through the identical draw/assign/shuffle path.
export function startUndercoverRound(variantId: UndercoverVariantId): void {
  const players = useRoomStore.getState().players;
  const variant = getUndercoverVariant(variantId);
  const wordPair = undercoverContentEngine.drawPair();
  const roleAssignments = assignRoles(players, variant, wordPair);
  const turnOrder = shuffle(players.map((player) => player.id));

  useTurnStore.getState().startGame(roleAssignments, turnOrder);
}

// After an elimination that wasn't Mr. White, decide the winner (if any)
// and navigate to GameOver, or back to ClueTurn for another round.
export function resolveWinCheckAndNavigate(navigation: UndercoverNavigation): void {
  const state = useTurnStore.getState();
  const remainingRoles = state.roleAssignments.filter((a) => !state.eliminatedPlayerIds.includes(a.playerId));
  const winner = checkWinner(remainingRoles);
  useTurnStore.getState().resolveWinCheck(winner);

  navigation.navigate(useTurnStore.getState().phase === 'gameOver' ? 'GameOver' : 'ClueTurn');
}
