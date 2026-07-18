import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import { spacing, typography, useTheme } from '../../../shared/theme';
import type { UndercoverStackParamList } from '../UndercoverNavigator';
import { useConfirmEndGame } from '../useConfirmEndGame';

type ClueTurnNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'ClueTurn'>;

const ON_PRIMARY_COLOR = '#FFFFFF';

export function ClueTurn() {
  const navigation = useNavigation<ClueTurnNavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();
  useConfirmEndGame(navigation);

  const players = useRoomStore((s) => s.players);
  const phase = useTurnStore((s) => s.phase);
  const roundNumber = useTurnStore((s) => s.roundNumber);
  const turnOrder = useTurnStore((s) => s.turnOrder);
  const eliminatedPlayerIds = useTurnStore((s) => s.eliminatedPlayerIds);
  const currentTurnPlayerId = useTurnStore((s) => s.currentTurnPlayerId);
  const advanceClueTurn = useTurnStore((s) => s.advanceClueTurn);
  const startVote = useTurnStore((s) => s.startVote);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const activeOrder = useMemo(
    () => turnOrder.filter((id) => !eliminatedPlayerIds.includes(id)),
    [turnOrder, eliminatedPlayerIds],
  );

  const currentPlayer = currentTurnPlayerId ? playersById.get(currentTurnPlayerId) : undefined;
  const currentIndex = currentTurnPlayerId ? activeOrder.indexOf(currentTurnPlayerId) : -1;
  const isLastTurn = currentIndex === activeOrder.length - 1;

  function handleNextTurn() {
    advanceClueTurn();
  }

  function handleStartVote() {
    startVote();
    navigation.navigate('Vote');
  }

  if (phase === 'discussion') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('clueTurn.round', { number: roundNumber })}
        </Text>
        <Text style={[typography.title, styles.centerText, { color: colors.text }]}>
          {t('clueTurn.openDiscussion')}
        </Text>
        <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
          {t('clueTurn.discussionPrompt')}
        </Text>
        <Pressable onPress={handleStartVote} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
          <Text style={[typography.subtitle, styles.onPrimaryText]}>{t('clueTurn.startVote')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('clueTurn.round', { number: roundNumber })}
      </Text>
      <Text style={[typography.title, styles.centerText, { color: colors.text }]}>
        {t('clueTurn.turnOf', { name: currentPlayer?.name ?? t('clueTurn.unknownPlayer') })}
      </Text>
      <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
        {t('clueTurn.cluePrompt')}
      </Text>

      <View style={styles.orderList}>
        {activeOrder.map((playerId, index) => {
          const player = playersById.get(playerId);
          if (!player) return null;
          const isCurrent = playerId === currentTurnPlayerId;
          const isDone = index < currentIndex;
          const rowBackground = isCurrent ? colors.primary : colors.surface;
          const nameColor = isCurrent ? ON_PRIMARY_COLOR : colors.text;
          return (
            <View key={playerId} style={[styles.orderRow, { borderColor: colors.border, backgroundColor: rowBackground }]}>
              <View style={[styles.colorSwatch, { backgroundColor: player.color }]} />
              <Text style={[typography.body, styles.playerName, { color: nameColor }]}>{player.name}</Text>
              {isDone && <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('clueTurn.done')}</Text>}
            </View>
          );
        })}
      </View>

      <Pressable onPress={handleNextTurn} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
        <Text style={[typography.subtitle, styles.onPrimaryText]}>
          {isLastTurn ? t('clueTurn.startDiscussion') : t('clueTurn.nextPlayer')}
        </Text>
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
    gap: spacing.sm,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  orderList: {
    width: '100%',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  orderRow: {
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
  playerName: {
    flex: 1,
  },
  actionButton: {
    marginTop: spacing.lg,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    width: 280,
  },
  onPrimaryText: {
    color: ON_PRIMARY_COLOR,
    fontWeight: '600',
    textAlign: 'center',
  },
});
