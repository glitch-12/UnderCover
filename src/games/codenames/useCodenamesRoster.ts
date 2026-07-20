import { useMemo } from 'react';
import { useRoomStore } from '../../core/room';
import type { Player } from '../../core/types';
import { useCodenamesStore } from './codenamesStore';
import type { CodenamesTeam } from './config';

export interface CodenamesRoster {
  players: Player[];
  playersById: Map<string, Player>;
  teamAssignments: Record<string, CodenamesTeam>;
  codemasters: Record<CodenamesTeam, string | null>;
  redPlayers: Player[];
  bluePlayers: Player[];
}

// Derives per-team rosters from RoomStore's player list + CodenamesStore's
// team/codemaster assignments, mirroring the undercover module's useRoster.
export function useCodenamesRoster(): CodenamesRoster {
  const players = useRoomStore((s) => s.players);
  const teamAssignments = useCodenamesStore((s) => s.teamAssignments);
  const codemasters = useCodenamesStore((s) => s.codemasters);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const redPlayers = useMemo(
    () => players.filter((p) => teamAssignments[p.id] === 'red'),
    [players, teamAssignments],
  );
  const bluePlayers = useMemo(
    () => players.filter((p) => teamAssignments[p.id] === 'blue'),
    [players, teamAssignments],
  );

  return { players, playersById, teamAssignments, codemasters, redPlayers, bluePlayers };
}
