import type { RoleAssignment } from '../../../core/types';

// remainingRoles = role assignments for players still in the game (not yet eliminated).
export function checkWinner(remainingRoles: RoleAssignment[]): 'civilians' | 'undercover' | null {
  const undercoverCount = remainingRoles.filter((r) => r.role === 'undercover').length;
  const mrWhiteCount = remainingRoles.filter((r) => r.role === 'mrWhite').length;
  const civilianCount = remainingRoles.filter((r) => r.role === 'civilian').length;

  if (undercoverCount === 0 && mrWhiteCount === 0) {
    return 'civilians';
  }
  if (undercoverCount > 0 && undercoverCount >= civilianCount) {
    return 'undercover';
  }
  return null;
}
