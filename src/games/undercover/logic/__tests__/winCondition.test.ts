import { checkWinner } from '../winCondition';
import type { RoleAssignment } from '../../../../core/types';

function roles(civilians: number, undercover: number, mrWhite: number): RoleAssignment[] {
  return [
    ...Array.from({ length: civilians }, (_, i) => ({ playerId: `c${i}`, role: 'civilian' as const, word: 'Coffee' })),
    ...Array.from({ length: undercover }, (_, i) => ({ playerId: `u${i}`, role: 'undercover' as const, word: 'Tea' })),
    ...Array.from({ length: mrWhite }, (_, i) => ({ playerId: `m${i}`, role: 'mrWhite' as const, word: null })),
  ];
}

describe('checkWinner', () => {
  it('returns null while civilians still outnumber undercover and impostors remain', () => {
    expect(checkWinner(roles(3, 1, 0))).toBeNull();
    expect(checkWinner(roles(4, 1, 1))).toBeNull();
  });

  it('civilians win once the last undercover is eliminated and there is no Mr. White', () => {
    expect(checkWinner(roles(3, 0, 0))).toBe('civilians');
  });

  it('does not declare civilians the winner while Mr. White is still alive, even with 0 undercover left', () => {
    expect(checkWinner(roles(2, 0, 1))).toBeNull();
  });

  it('undercover wins once they reach parity with civilians', () => {
    expect(checkWinner(roles(1, 1, 0))).toBe('undercover');
  });

  it('undercover wins once they outnumber civilians', () => {
    expect(checkWinner(roles(1, 2, 0))).toBe('undercover');
  });

  it('undercover wins at parity even if Mr. White is also still alive', () => {
    expect(checkWinner(roles(2, 2, 1))).toBe('undercover');
  });

  it('handles the fully-eliminated edge case without crashing', () => {
    expect(checkWinner(roles(0, 0, 0))).toBe('civilians');
  });

  it('does not declare undercover the winner when none remain, even with 0 civilians left and Mr. White alive', () => {
    expect(checkWinner(roles(0, 0, 1))).toBeNull();
  });
});
