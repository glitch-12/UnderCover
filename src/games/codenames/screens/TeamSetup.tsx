import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { Button, Icon, PlayerRow, ScreenContainer } from '../../../shared/components';
import { radii, spacing, typography, useTheme } from '../../../shared/theme';
import { shuffle } from '../../../core/content/deck';
import { CODENAMES_MAX_PLAYERS, CODENAMES_MIN_PLAYERS } from '../config';
import type { CodenamesTeam } from '../config';
import { startCodenamesRound } from '../codenamesGameFlow';
import { getOwnerColor } from '../teamColor';
import type { CodenamesNavigatorParamList } from '../CodenamesNavigator';

type TeamSetupNavigationProp = NativeStackNavigationProp<CodenamesNavigatorParamList, 'TeamSetup'>;

const PLAYER_COLORS = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#8B7CF6', '#F78C6B'];

function nextTeam(current: CodenamesTeam | undefined): CodenamesTeam | undefined {
  if (current === undefined) return 'red';
  if (current === 'red') return 'blue';
  return undefined;
}

export function TeamSetup() {
  const navigation = useNavigation<TeamSetupNavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();

  const players = useRoomStore((s) => s.players);
  const addPlayer = useRoomStore((s) => s.addPlayer);
  const removePlayer = useRoomStore((s) => s.removePlayer);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [teamAssignments, setTeamAssignments] = useState<Record<string, CodenamesTeam>>({});
  const [codemasters, setCodemasters] = useState<Record<CodenamesTeam, string | null>>({ red: null, blue: null });
  const lastAddRef = useRef<{ name: string; time: number } | null>(null);

  function handleAddPlayer() {
    const trimmedName = name.trim();
    const lastAdd = lastAddRef.current;
    if (lastAdd && lastAdd.name === trimmedName && Date.now() - lastAdd.time < 500) return;

    const result = addPlayer(name, PLAYER_COLORS[players.length % PLAYER_COLORS.length], CODENAMES_MAX_PLAYERS);
    if (result.success) {
      lastAddRef.current = { name: trimmedName, time: Date.now() };
      setName('');
      setError(null);
    } else {
      setError(result.error ?? 'Could not add player');
    }
  }

  function handleRemovePlayer(playerId: string) {
    removePlayer(playerId);
    setTeamAssignments((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
    setCodemasters((prev) => ({
      red: prev.red === playerId ? null : prev.red,
      blue: prev.blue === playerId ? null : prev.blue,
    }));
  }

  function handleCycleTeam(playerId: string) {
    const previousTeam = teamAssignments[playerId];
    const team = nextTeam(previousTeam);

    setTeamAssignments((prev) => {
      const next = { ...prev };
      if (team) {
        next[playerId] = team;
      } else {
        delete next[playerId];
      }
      return next;
    });

    // Leaving a team can't stay that team's Codemaster.
    if (previousTeam && previousTeam !== team) {
      setCodemasters((prev) => (prev[previousTeam] === playerId ? { ...prev, [previousTeam]: null } : prev));
    }
  }

  function handleSetCodemaster(playerId: string, team: CodenamesTeam) {
    setCodemasters((prev) => ({ ...prev, [team]: prev[team] === playerId ? null : playerId }));
  }

  const redPlayers = players.filter((p) => teamAssignments[p.id] === 'red');
  const bluePlayers = players.filter((p) => teamAssignments[p.id] === 'blue');
  const teamsReady =
    redPlayers.length >= 2 && bluePlayers.length >= 2 && Boolean(codemasters.red) && Boolean(codemasters.blue);
  const canStart = players.length >= CODENAMES_MIN_PLAYERS && teamsReady;

  function handleStart() {
    if (!canStart) return;
    const startingTeam = shuffle<CodenamesTeam>(['red', 'blue'])[0];
    startCodenamesRound(teamAssignments, codemasters, startingTeam);
    navigation.navigate('CodemasterReveal');
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[typography.subtitle, { color: colors.text }]}>{t('codenames.teamSetup.playersTitle')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('codenames.teamSetup.playersCount', {
              count: players.length,
              max: CODENAMES_MAX_PLAYERS,
              min: CODENAMES_MIN_PLAYERS,
            })}
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Rules')} style={styles.rulesButton} hitSlop={8}>
          <Icon name="help-circle" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleAddPlayer}
          placeholder={t('codenames.teamSetup.playerNamePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          returnKeyType="done"
        />
        <Pressable onPress={handleAddPlayer} style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Icon name="plus" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={14} color={colors.danger} />
          <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      <Text style={[typography.subtitle, styles.sectionTitle, { color: colors.text }]}>{t('codenames.teamSetup.teamsTitle')}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('codenames.teamSetup.tapToAssign')}</Text>

      <View style={styles.playerList}>
        {players.map((player) => {
          const team = teamAssignments[player.id];
          const teamColor = team ? getOwnerColor(colors, team) : colors.border;
          const isCodemaster = team ? codemasters[team] === player.id : false;
          const teamPillBackground = team ? `${teamColor}22` : 'transparent';

          return (
            <PlayerRow
              key={player.id}
              name={player.name}
              color={player.color}
              trailing={
                <View style={styles.trailingControls}>
                  <Pressable
                    onPress={() => handleCycleTeam(player.id)}
                    style={[styles.teamPill, { borderColor: teamColor, backgroundColor: teamPillBackground }]}
                  >
                    <Text style={[typography.caption, { color: team ? teamColor : colors.textSecondary }]}>
                      {team ? t(`codenames.team.${team}Short`) : t('codenames.teamSetup.unassigned')}
                    </Text>
                  </Pressable>
                  {team && (
                    <Pressable onPress={() => handleSetCodemaster(player.id, team)} hitSlop={8}>
                      <Icon name="star" size={18} color={isCodemaster ? teamColor : colors.textSecondary} />
                    </Pressable>
                  )}
                  <Pressable onPress={() => handleRemovePlayer(player.id)} hitSlop={8}>
                    <Icon name="trash-2" size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              }
            />
          );
        })}
      </View>

      <Button
        title={t('codenames.teamSetup.startGame')}
        icon="play"
        onPress={handleStart}
        disabled={!canStart}
        style={styles.startButton}
      />
      {!canStart && (
        <Text style={[typography.caption, styles.hintText, { color: colors.textSecondary }]}>
          {t('codenames.teamSetup.needTeams')}
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  rulesButton: {
    padding: spacing.xs,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    marginTop: spacing.md,
  },
  playerList: {
    gap: spacing.xs,
  },
  trailingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamPill: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  startButton: {
    marginTop: spacing.lg,
  },
  hintText: {
    textAlign: 'center',
  },
});
