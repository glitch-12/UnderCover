import type { IconName } from '../shared/components';
import { CODENAMES_MAX_PLAYERS, CODENAMES_MIN_PLAYERS } from '../games/codenames/config';
import { UNDERCOVER_MAX_PLAYERS, UNDERCOVER_MIN_PLAYERS } from '../games/undercover/config';
import type { RootStackParamList } from './Navigation';

export interface GameModule {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  minPlayers: number;
  maxPlayers: number;
  route: keyof Omit<RootStackParamList, 'Home'>;
}

export const gameModules: GameModule[] = [
  {
    id: 'undercover',
    name: 'Undercover',
    description: 'Find the odd word out',
    icon: 'eye-off',
    minPlayers: UNDERCOVER_MIN_PLAYERS,
    maxPlayers: UNDERCOVER_MAX_PLAYERS,
    route: 'Undercover',
  },
  {
    id: 'codenames',
    name: 'Codenames',
    description: 'Give one-word clues to guess your team’s agents',
    icon: 'grid',
    minPlayers: CODENAMES_MIN_PLAYERS,
    maxPlayers: CODENAMES_MAX_PLAYERS,
    route: 'Codenames',
  },
];
