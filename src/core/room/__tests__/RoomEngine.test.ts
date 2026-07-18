import { useRoomStore, isRoomReadyForGame } from '../RoomEngine';

beforeEach(() => {
  useRoomStore.getState().reset();
});

describe('addPlayer', () => {
  it('adds a player with the given name and color', () => {
    const result = useRoomStore.getState().addPlayer('Asha', '#ff0000', 20);
    expect(result).toEqual({ success: true });

    const { players } = useRoomStore.getState();
    expect(players).toHaveLength(1);
    expect(players[0]).toMatchObject({ name: 'Asha', color: '#ff0000', isEliminated: false });
    expect(players[0].id).toBeTruthy();
  });

  it('trims whitespace from the name', () => {
    useRoomStore.getState().addPlayer('  Ravi  ', '#00ff00', 20);
    expect(useRoomStore.getState().players[0].name).toBe('Ravi');
  });

  it('rejects an empty (or whitespace-only) name and does not add a player', () => {
    const result = useRoomStore.getState().addPlayer('   ', '#00ff00', 20);
    expect(result.success).toBe(false);
    expect(useRoomStore.getState().players).toHaveLength(0);
  });

  it('rejects adding beyond maxPlayers', () => {
    for (let i = 0; i < 3; i += 1) {
      expect(useRoomStore.getState().addPlayer(`P${i}`, '#000', 3).success).toBe(true);
    }

    const result = useRoomStore.getState().addPlayer('One Too Many', '#000', 3);
    expect(result.success).toBe(false);
    expect(useRoomStore.getState().players).toHaveLength(3);
  });

  it('assigns each player a unique id', () => {
    useRoomStore.getState().addPlayer('A', '#000', 20);
    useRoomStore.getState().addPlayer('B', '#000', 20);
    const { players } = useRoomStore.getState();
    expect(players[0].id).not.toBe(players[1].id);
  });
});

describe('removePlayer', () => {
  it('removes the player with the given id, leaving others intact', () => {
    useRoomStore.getState().addPlayer('A', '#000', 20);
    useRoomStore.getState().addPlayer('B', '#000', 20);
    const [a, b] = useRoomStore.getState().players;

    const result = useRoomStore.getState().removePlayer(a.id);
    expect(result).toEqual({ success: true });

    const { players } = useRoomStore.getState();
    expect(players).toHaveLength(1);
    expect(players[0].id).toBe(b.id);
  });

  it('fails for an id that does not exist, without changing state', () => {
    useRoomStore.getState().addPlayer('A', '#000', 20);
    const result = useRoomStore.getState().removePlayer('not-a-real-id');
    expect(result.success).toBe(false);
    expect(useRoomStore.getState().players).toHaveLength(1);
  });

  it('is always allowed even if it takes the roster below minPlayers', () => {
    useRoomStore.getState().addPlayer('A', '#000', 20);
    useRoomStore.getState().addPlayer('B', '#000', 20);
    useRoomStore.getState().addPlayer('C', '#000', 20);
    const [a] = useRoomStore.getState().players;

    // minPlayers=3, removing one drops the roster to 2 — the store must
    // still allow the removal; only "can we start the game" is gated.
    const result = useRoomStore.getState().removePlayer(a.id);
    expect(result.success).toBe(true);
    expect(useRoomStore.getState().players).toHaveLength(2);
    expect(isRoomReadyForGame(useRoomStore.getState().players, 3, 20).success).toBe(false);
  });
});

describe('reorderPlayers', () => {
  it('moves a player from one index to another', () => {
    useRoomStore.getState().addPlayer('A', '#000', 20);
    useRoomStore.getState().addPlayer('B', '#000', 20);
    useRoomStore.getState().addPlayer('C', '#000', 20);

    const result = useRoomStore.getState().reorderPlayers(0, 2);
    expect(result).toEqual({ success: true });
    expect(useRoomStore.getState().players.map((p) => p.name)).toEqual(['B', 'C', 'A']);
  });

  it('rejects out-of-bounds indices and leaves order unchanged', () => {
    useRoomStore.getState().addPlayer('A', '#000', 20);
    useRoomStore.getState().addPlayer('B', '#000', 20);

    const result = useRoomStore.getState().reorderPlayers(0, 5);
    expect(result.success).toBe(false);
    expect(useRoomStore.getState().players.map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('rejects negative indices', () => {
    useRoomStore.getState().addPlayer('A', '#000', 20);
    const result = useRoomStore.getState().reorderPlayers(-1, 0);
    expect(result.success).toBe(false);
  });
});

describe('isRoomReadyForGame', () => {
  it('is not ready below minPlayers', () => {
    useRoomStore.getState().addPlayer('A', '#000', 20);
    useRoomStore.getState().addPlayer('B', '#000', 20);
    expect(isRoomReadyForGame(useRoomStore.getState().players, 3, 20).success).toBe(false);
  });

  it('is ready exactly at minPlayers', () => {
    for (let i = 0; i < 3; i += 1) useRoomStore.getState().addPlayer(`P${i}`, '#000', 20);
    expect(isRoomReadyForGame(useRoomStore.getState().players, 3, 20).success).toBe(true);
  });

  it('is ready exactly at maxPlayers', () => {
    for (let i = 0; i < 20; i += 1) useRoomStore.getState().addPlayer(`P${i}`, '#000', 20);
    expect(isRoomReadyForGame(useRoomStore.getState().players, 3, 20).success).toBe(true);
  });

  it('is not ready above maxPlayers', () => {
    const players = Array.from({ length: 21 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
      color: '#000',
      isEliminated: false,
    }));
    expect(isRoomReadyForGame(players, 3, 20).success).toBe(false);
  });
});
