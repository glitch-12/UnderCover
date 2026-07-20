import { useMemo } from 'react';
import { useRoomStore } from '../../core/room';
import { useTurnStore } from '../../core/turn';
import type { Player, RoleAssignment } from '../../core/types';

export interface Roster {
  players: Player[];
  playersById: Map<string, Player>;
  assignmentsByPlayerId: Map<string, RoleAssignment>;
  turnOrder: string[];
  eliminatedPlayerIds: string[];
  activeOrder: string[];
}

// Derives the player/assignment lookups every round screen needs from
// RoomStore + TurnStore. Shared so "active player" and "assignment lookup"
// semantics only have to change in one place.
export function useRoster(): Roster {
  const players = useRoomStore((s) => s.players);
  const roleAssignments = useTurnStore((s) => s.roleAssignments);
  const turnOrder = useTurnStore((s) => s.turnOrder);
  const eliminatedPlayerIds = useTurnStore((s) => s.eliminatedPlayerIds);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const assignmentsByPlayerId = useMemo(
    () => new Map(roleAssignments.map((a) => [a.playerId, a])),
    [roleAssignments],
  );
  const activeOrder = useMemo(
    () => turnOrder.filter((id) => !eliminatedPlayerIds.includes(id)),
    [turnOrder, eliminatedPlayerIds],
  );

  return { players, playersById, assignmentsByPlayerId, turnOrder, eliminatedPlayerIds, activeOrder };
}
