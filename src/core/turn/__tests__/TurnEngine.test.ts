import { useTurnStore } from '../TurnEngine';
import type { RoleAssignment } from '../../types';

beforeEach(() => {
  useTurnStore.getState().reset();
});

function assignment(playerId: string, role: RoleAssignment['role']): RoleAssignment {
  return { playerId, role, word: role === 'mrWhite' ? null : role === 'civilian' ? 'Coffee' : 'Tea' };
}

/** Drives currentTurnPlayerId through a full clue cycle so the machine lands on "discussion". */
function runClueCycle(playerCount: number) {
  for (let i = 0; i < playerCount; i += 1) {
    useTurnStore.getState().advanceClueTurn();
  }
}

describe('TurnEngine — full game flows', () => {
  it('wins by civilians after eliminating all undercover players across multiple rounds', () => {
    const roleAssignments = [
      assignment('c1', 'civilian'),
      assignment('c2', 'civilian'),
      assignment('c3', 'civilian'),
      assignment('u1', 'undercover'),
      assignment('u2', 'undercover'),
    ];
    const turnOrder = ['c1', 'c2', 'c3', 'u1', 'u2'];
    const store = useTurnStore.getState();

    expect(store.startGame(roleAssignments, turnOrder)).toEqual({ success: true });
    expect(useTurnStore.getState().phase).toBe('roleAssignment');

    expect(useTurnStore.getState().confirmRoleAssignmentComplete()).toEqual({ success: true });
    expect(useTurnStore.getState()).toMatchObject({ phase: 'clueTurn', roundNumber: 1, currentTurnPlayerId: 'c1' });

    // Round 1: full clue cycle -> discussion -> vote -> eliminate an undercover.
    runClueCycle(5);
    expect(useTurnStore.getState().phase).toBe('discussion');

    expect(useTurnStore.getState().startVote()).toEqual({ success: true });
    expect(useTurnStore.getState().eliminatePlayer('u1')).toEqual({ success: true });
    expect(useTurnStore.getState().eliminatedPlayerIds).toEqual(['u1']);

    expect(useTurnStore.getState().continueAfterElimination()).toEqual({ success: true });
    expect(useTurnStore.getState().phase).toBe('winCheck'); // u1 wasn't Mr. White

    // Still one undercover left — no winner yet, loop back to clueTurn.
    expect(useTurnStore.getState().resolveWinCheck(null)).toEqual({ success: true });
    expect(useTurnStore.getState()).toMatchObject({ phase: 'clueTurn', roundNumber: 2, currentTurnPlayerId: 'c1' });

    // Round 2: eliminated player is skipped from the active turn order.
    runClueCycle(4); // only 4 active players remain (c1, c2, c3, u2)
    expect(useTurnStore.getState().phase).toBe('discussion');

    useTurnStore.getState().startVote();
    useTurnStore.getState().eliminatePlayer('u2');
    useTurnStore.getState().continueAfterElimination();
    expect(useTurnStore.getState().phase).toBe('winCheck');

    expect(useTurnStore.getState().resolveWinCheck('civilians')).toEqual({ success: true });
    expect(useTurnStore.getState()).toMatchObject({ phase: 'gameOver', winner: 'civilians' });
  });

  it('wins by undercover once parity is reached', () => {
    const roleAssignments = [assignment('c1', 'civilian'), assignment('c2', 'civilian'), assignment('u1', 'undercover')];
    const turnOrder = ['c1', 'c2', 'u1'];

    useTurnStore.getState().startGame(roleAssignments, turnOrder);
    useTurnStore.getState().confirmRoleAssignmentComplete();
    runClueCycle(3);
    useTurnStore.getState().startVote();

    useTurnStore.getState().eliminatePlayer('c1');
    expect(useTurnStore.getState().continueAfterElimination()).toEqual({ success: true });
    expect(useTurnStore.getState().phase).toBe('winCheck');

    expect(useTurnStore.getState().resolveWinCheck('undercover')).toEqual({ success: true });
    expect(useTurnStore.getState()).toMatchObject({ phase: 'gameOver', winner: 'undercover' });
  });

  it('wins by a correct Mr. White guess immediately after elimination', () => {
    const roleAssignments = [
      assignment('c1', 'civilian'),
      assignment('c2', 'civilian'),
      assignment('u1', 'undercover'),
      assignment('mw1', 'mrWhite'),
    ];
    const turnOrder = ['c1', 'c2', 'u1', 'mw1'];

    useTurnStore.getState().startGame(roleAssignments, turnOrder);
    useTurnStore.getState().confirmRoleAssignmentComplete();
    runClueCycle(4);
    useTurnStore.getState().startVote();

    useTurnStore.getState().eliminatePlayer('mw1');
    expect(useTurnStore.getState().continueAfterElimination()).toEqual({ success: true });
    expect(useTurnStore.getState().phase).toBe('mrWhiteGuess'); // branches here because mw1 is Mr. White

    expect(useTurnStore.getState().resolveMrWhiteGuess(true)).toEqual({ success: true });
    expect(useTurnStore.getState()).toMatchObject({ phase: 'gameOver', winner: 'mrWhite' });
  });

  it('falls through to winCheck when the Mr. White guess is wrong', () => {
    const roleAssignments = [assignment('c1', 'civilian'), assignment('c2', 'civilian'), assignment('mw1', 'mrWhite')];
    const turnOrder = ['c1', 'c2', 'mw1'];

    useTurnStore.getState().startGame(roleAssignments, turnOrder);
    useTurnStore.getState().confirmRoleAssignmentComplete();
    runClueCycle(3);
    useTurnStore.getState().startVote();
    useTurnStore.getState().eliminatePlayer('mw1');
    useTurnStore.getState().continueAfterElimination();

    expect(useTurnStore.getState().resolveMrWhiteGuess(false)).toEqual({ success: true });
    expect(useTurnStore.getState().phase).toBe('winCheck');

    expect(useTurnStore.getState().resolveWinCheck('civilians')).toEqual({ success: true });
    expect(useTurnStore.getState()).toMatchObject({ phase: 'gameOver', winner: 'civilians' });
  });

  it('returns to lobby on playAgain, clearing round-specific state', () => {
    const roleAssignments = [assignment('c1', 'civilian'), assignment('u1', 'undercover')];
    useTurnStore.getState().startGame(roleAssignments, ['c1', 'u1']);
    useTurnStore.getState().confirmRoleAssignmentComplete();
    runClueCycle(2);
    useTurnStore.getState().startVote();
    useTurnStore.getState().eliminatePlayer('u1');
    useTurnStore.getState().continueAfterElimination();
    useTurnStore.getState().resolveWinCheck('civilians');

    expect(useTurnStore.getState().playAgain()).toEqual({ success: true });
    expect(useTurnStore.getState()).toMatchObject({
      phase: 'lobby',
      roundNumber: 0,
      roleAssignments: [],
      turnOrder: [],
      currentTurnPlayerId: null,
      eliminatedPlayerIds: [],
      winner: null,
    });
  });
});

describe('TurnEngine — phase guards', () => {
  it('rejects actions called from the wrong phase and leaves state unchanged', () => {
    expect(useTurnStore.getState().startVote()).toMatchObject({ success: false });
    expect(useTurnStore.getState().phase).toBe('lobby');

    expect(useTurnStore.getState().eliminatePlayer('anyone')).toMatchObject({ success: false });
    expect(useTurnStore.getState().resolveMrWhiteGuess(true)).toMatchObject({ success: false });
    expect(useTurnStore.getState().resolveWinCheck('civilians')).toMatchObject({ success: false });
    expect(useTurnStore.getState().playAgain()).toMatchObject({ success: false });
  });

  it('rejects starting a game with an empty turn order', () => {
    const result = useTurnStore.getState().startGame([assignment('c1', 'civilian')], []);
    expect(result.success).toBe(false);
    expect(useTurnStore.getState().phase).toBe('lobby');
  });

  it('rejects eliminating a player id that has no role assignment', () => {
    useTurnStore.getState().startGame([assignment('c1', 'civilian'), assignment('u1', 'undercover')], ['c1', 'u1']);
    useTurnStore.getState().confirmRoleAssignmentComplete();
    runClueCycle(2);
    useTurnStore.getState().startVote();

    const result = useTurnStore.getState().eliminatePlayer('ghost');
    expect(result.success).toBe(false);
    expect(useTurnStore.getState().eliminatedPlayerIds).toEqual([]);
  });
});
