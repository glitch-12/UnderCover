export const CODENAMES_MIN_PLAYERS = 4;
export const CODENAMES_MAX_PLAYERS = 20;

export const CODENAMES_BOARD_ROWS = 5;
export const CODENAMES_BOARD_COLUMNS = 5;
export const CODENAMES_BOARD_SIZE = CODENAMES_BOARD_ROWS * CODENAMES_BOARD_COLUMNS;

// Classic Codenames card-count split for a 25-card board: the starting team
// gets one extra card (9) over the second team (8), plus 7 neutral and a
// single assassin. 9 + 8 + 7 + 1 = 25.
export const CODENAMES_STARTING_TEAM_CARD_COUNT = 9;
export const CODENAMES_SECOND_TEAM_CARD_COUNT = 8;
export const CODENAMES_NEUTRAL_CARD_COUNT = 7;
export const CODENAMES_ASSASSIN_CARD_COUNT = 1;

export type CodenamesTeam = 'red' | 'blue';
