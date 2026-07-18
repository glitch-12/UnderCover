import { UNDERCOVER_MAX_PLAYERS, UNDERCOVER_MIN_PLAYERS } from '../games/undercover/config';
import type { RootStackParamList } from './Navigation';

export interface GameModule {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  route: keyof Omit<RootStackParamList, 'Home'>;
}

export const gameModules: GameModule[] = [
  {
    id: 'undercover',
    name: 'Undercover',
    description: 'Find the odd word out',
    minPlayers: UNDERCOVER_MIN_PLAYERS,
    maxPlayers: UNDERCOVER_MAX_PLAYERS,
    route: 'Undercover',
  },
];
