import { useNavigation, usePreventRemove } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Icon, ScreenContainer } from '../../../shared/components';
import { radii, spacing, typography, useTheme } from '../../../shared/theme';
import { startCodenamesRound } from '../codenamesGameFlow';
import { useCodenamesStore } from '../codenamesStore';
import type { CodenamesNavigatorParamList } from '../CodenamesNavigator';
import type { CodenamesTeam } from '../config';
import { getOwnerColor } from '../teamColor';
import { BACK_ACTION_TYPES } from '../useConfirmEndGame';
import { useCodenamesRoster } from '../useCodenamesRoster';

type NavigationProp = NativeStackNavigationProp<CodenamesNavigatorParamList, 'GameOver'>;

export function GameOver() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();

  const winner = useCodenamesStore((s) => s.winner);
  const cards = useCodenamesStore((s) => s.cards);
  const currentTeam = useCodenamesStore((s) => s.currentTeam);
  const playAgain = useCodenamesStore((s) => s.playAgain);
  const { teamAssignments, codemasters, redPlayers, bluePlayers } = useCodenamesRoster();

  const winnerColor = winner ? getOwnerColor(colors, winner) : colors.primary;

  function handlePlayAgain() {
    // Re-draw teams/codemasters into a fresh round before resetting the
    // store, since playAgain() wipes teamAssignments/codemasters too.
    const nextStartingTeam: CodenamesTeam = currentTeam === 'red' ? 'blue' : 'red';
    playAgain();
    startCodenamesRound(teamAssignments, codemasters, nextStartingTeam);
    navigation.reset({ index: 0, routes: [{ name: 'CodemasterReveal' }] });
  }

  function handleNewGame() {
    playAgain();
    navigation.reset({ index: 0, routes: [{ name: 'TeamSetup' }] });
  }

  usePreventRemove(true, ({ data }) => {
    if (!BACK_ACTION_TYPES.has(data.action.type)) {
      navigation.dispatch(data.action);
      return;
    }
    handleNewGame();
  });

  function renderTeam(team: CodenamesTeam, teamPlayers: typeof redPlayers) {
    const teamColor = getOwnerColor(colors, team);
    return (
      <View key={team} style={styles.teamColumn}>
        <Text style={[typography.label, { color: teamColor }]}>{t(`codenames.team.${team}`)}</Text>
        {teamPlayers.map((player) => (
          <View key={player.id} style={[styles.playerRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Avatar name={player.name} color={player.color} size={28} />
            <Text style={[typography.caption, styles.playerName, { color: colors.text }]} numberOfLines={1}>
              {player.name}
              {codemasters[team] === player.id ? t('codenames.gameOver.codemasterSuffix') : ''}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={[styles.heroBanner, { backgroundColor: `${winnerColor}18`, borderColor: `${winnerColor}55` }]}>
        <View style={[styles.trophyBadge, { backgroundColor: `${winnerColor}33` }]}>
          <Icon name="award" size={32} color={winnerColor} />
        </View>
        <Text style={[typography.display, styles.centerText, { color: colors.text }]}>
          {winner ? t('codenames.gameOver.winner', { team: t(`codenames.team.${winner}Short`) }) : t('codenames.gameOver.gameOver')}
        </Text>
      </View>

      <View style={styles.keyGrid}>
        {cards.map((card) => {
          const ownerColor = getOwnerColor(colors, card.owner);
          return (
            <View key={card.id} style={[styles.keyCell, { backgroundColor: `${ownerColor}33`, borderColor: ownerColor }]}>
              <Text style={[typography.caption, styles.keyCellText, { color: colors.text }]} numberOfLines={2}>
                {card.word}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.teamsRow}>
        {renderTeam('red', redPlayers)}
        {renderTeam('blue', bluePlayers)}
      </View>

      <Button title={t('codenames.gameOver.playAgain')} icon="refresh-cw" onPress={handlePlayAgain} style={styles.actionButton} />
      <Button
        title={t('codenames.gameOver.newGame')}
        icon="home"
        variant="outline"
        onPress={handleNewGame}
        style={styles.actionButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerText: {
    textAlign: 'center',
  },
  heroBanner: {
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  trophyBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  keyCell: {
    width: '18%',
    aspectRatio: 1.3,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  keyCellText: {
    textAlign: 'center',
  },
  teamsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  teamColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.xs,
  },
  playerName: {
    flex: 1,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
});
