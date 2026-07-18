import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import { spacing, typography, useTheme } from '../../../shared/theme';
import { startUndercoverRound } from '../gameFlow';
import { getLastVariantId } from '../gameSession';
import type { UndercoverStackParamList } from '../UndercoverNavigator';
import { BACK_ACTION_TYPES } from '../useConfirmEndGame';

type GameOverNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'GameOver'>;

const ON_PRIMARY_COLOR = '#FFFFFF';

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[typography.title, styles.centerText, { color: colors.text }]}>
        {winner ? t(`gameOver.winner.${winner}`) : t('gameOver.gameOver')}
      </Text>

      <View style={styles.roleList}>
        {players.map((player) => {
          const assignment = assignmentsByPlayerId.get(player.id);
          const eliminated = eliminatedPlayerIds.includes(player.id);
          const roleLabel = assignment ? t(`gameOver.role.${assignment.role}`) : null;
          return (
            <View key={player.id} style={[styles.roleRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={[styles.colorSwatch, { backgroundColor: player.color }]} />
              <View style={styles.roleInfo}>
                <Text style={[typography.body, { color: colors.text }]}>
                  {player.name}
                  {eliminated ? t('gameOver.eliminatedSuffix') : ''}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {assignment
                    ? assignment.word
                      ? t('gameOver.roleWithWord', { role: roleLabel, word: assignment.word })
                      : roleLabel
                    : t('gameOver.unknownRole')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable onPress={handlePlayAgain} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
        <Text style={[typography.subtitle, styles.onPrimaryText]}>{t('gameOver.playAgain')}</Text>
      </Pressable>
      <Pressable
        onPress={handleNewGame}
        style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.border }]}
      >
        <Text style={[typography.subtitle, { color: colors.text }]}>{t('gameOver.newGame')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  roleList: {
    width: '100%',
    gap: spacing.xs,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  roleInfo: {
    flex: 1,
  },
  actionButton: {
    marginTop: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    width: 280,
  },
  secondaryButton: {
    marginTop: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  onPrimaryText: {
    color: ON_PRIMARY_COLOR,
    fontWeight: '600',
    textAlign: 'center',
  },
});
