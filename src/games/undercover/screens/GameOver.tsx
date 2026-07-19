import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import { Button, Icon, RoleBadge, ScreenContainer } from '../../../shared/components';
import { getContrastTextColor, getRoleColor, radii, spacing, typography, useTheme } from '../../../shared/theme';
import type { ThemeColors } from '../../../shared/theme';
import { startUndercoverRound } from '../gameFlow';
import { getLastVariantId } from '../gameSession';
import type { UndercoverStackParamList } from '../UndercoverNavigator';
import { BACK_ACTION_TYPES } from '../useConfirmEndGame';

type GameOverNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'GameOver'>;

function getWinnerColor(colors: ThemeColors, winner: 'civilians' | 'undercover' | 'mrWhite' | null): string {
  if (winner === 'civilians') return colors.success;
  if (winner === 'undercover') return colors.danger;
  if (winner === 'mrWhite') return colors.warning;
  return colors.primary;
}

export function GameOver() {
  const navigation = useNavigation<GameOverNavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();

  const players = useRoomStore((s) => s.players);
  const winner = useTurnStore((s) => s.winner);
  const roleAssignments = useTurnStore((s) => s.roleAssignments);
  const eliminatedPlayerIds = useTurnStore((s) => s.eliminatedPlayerIds);
  const playAgain = useTurnStore((s) => s.playAgain);

  const assignmentsByPlayerId = useMemo(() => new Map(roleAssignments.map((a) => [a.playerId, a])), [roleAssignments]);
  const winnerColor = getWinnerColor(colors, winner);

  function handlePlayAgain() {
    playAgain();
    startUndercoverRound(getLastVariantId());
    navigation.navigate('RoleReveal');
  }

  function handleNewGame() {
    playAgain();
    navigation.navigate('Lobby');
  }

  // The round already ended here, so back navigation (header button,
  // hardware back, swipe gesture) goes straight to the New Game flow
  // instead of the mid-game "end game or new game" confirmation — there's
  // no in-progress round left to confirm losing.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!BACK_ACTION_TYPES.has(e.data.action.type)) return;
      e.preventDefault();
      handleNewGame();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  return (
    <ScreenContainer>
      <View style={[styles.heroBanner, { backgroundColor: `${winnerColor}18`, borderColor: `${winnerColor}55` }]}>
        <View style={[styles.trophyBadge, { backgroundColor: `${winnerColor}33` }]}>
          <Icon name="award" size={32} color={winnerColor} />
        </View>
        <Text style={[typography.display, styles.centerText, { color: colors.text }]}>
          {winner ? t(`gameOver.winner.${winner}`) : t('gameOver.gameOver')}
        </Text>
      </View>

      <View style={styles.roleList}>
        {players.map((player) => {
          const assignment = assignmentsByPlayerId.get(player.id);
          const eliminated = eliminatedPlayerIds.includes(player.id);
          const roleLabel = assignment ? t(`gameOver.role.${assignment.role}`) : null;
          const accentColor = assignment ? getRoleColor(colors, assignment.role) : colors.border;

          return (
            <View
              key={player.id}
              style={[
                styles.roleRow,
                { borderColor: colors.border, backgroundColor: colors.surface, opacity: eliminated ? 0.55 : 1 },
              ]}
            >
              <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
              <View style={[styles.avatar, { backgroundColor: player.color }]}>
                <Text style={[typography.caption, { color: getContrastTextColor(player.color) }]}>
                  {player.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.roleInfo}>
                <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                  {player.name}
                  {eliminated ? t('gameOver.eliminatedSuffix') : ''}
                </Text>
                {assignment && roleLabel ? (
                  <View style={styles.badgeRow}>
                    <RoleBadge role={assignment.role} label={roleLabel} />
                    {assignment.word && (
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>{assignment.word}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('gameOver.unknownRole')}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Button title={t('gameOver.playAgain')} icon="refresh-cw" onPress={handlePlayAgain} style={styles.actionButton} />
      <Button
        title={t('gameOver.newGame')}
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
  roleList: {
    width: '100%',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radii.pill,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
});
