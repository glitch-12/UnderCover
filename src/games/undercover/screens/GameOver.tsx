import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import type { Role, RoundState } from '../../../core/types';
import { spacing, typography, useTheme } from '../../../shared/theme';
import { startUndercoverRound } from '../gameFlow';
import { getLastVariantId } from '../gameSession';
import type { UndercoverStackParamList } from '../UndercoverNavigator';

type GameOverNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'GameOver'>;

const ON_PRIMARY_COLOR = '#FFFFFF';

const WINNER_LABEL: Record<NonNullable<RoundState['winner']>, string> = {
  civilians: 'Civilians Win!',
  undercover: 'Undercover Wins!',
  mrWhite: 'Mr. White Wins!',
};

const ROLE_LABEL: Record<Role, string> = {
  civilian: 'Civilian',
  undercover: 'Undercover',
  mrWhite: 'Mr. White',
};

export function GameOver() {
  const navigation = useNavigation<GameOverNavigationProp>();
  const colors = useTheme();

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[typography.title, styles.centerText, { color: colors.text }]}>
        {winner ? WINNER_LABEL[winner] : 'Game Over'}
      </Text>

      <View style={styles.roleList}>
        {players.map((player) => {
          const assignment = assignmentsByPlayerId.get(player.id);
          const eliminated = eliminatedPlayerIds.includes(player.id);
          return (
            <View key={player.id} style={[styles.roleRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={[styles.colorSwatch, { backgroundColor: player.color }]} />
              <View style={styles.roleInfo}>
                <Text style={[typography.body, { color: colors.text }]}>
                  {player.name}
                  {eliminated ? ' (eliminated)' : ''}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {assignment ? `${ROLE_LABEL[assignment.role]}${assignment.word ? ` — ${assignment.word}` : ''}` : 'Unknown'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable onPress={handlePlayAgain} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
        <Text style={[typography.subtitle, styles.onPrimaryText]}>Play Again</Text>
      </Pressable>
      <Pressable
        onPress={handleNewGame}
        style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.border }]}
      >
        <Text style={[typography.subtitle, { color: colors.text }]}>New Game</Text>
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
