import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import { Button, Icon, ScreenContainer } from '../../../shared/components';
import { getContrastTextColor, radii, spacing, typography, useTheme } from '../../../shared/theme';
import type { UndercoverStackParamList } from '../UndercoverNavigator';
import { useConfirmEndGame } from '../useConfirmEndGame';

type ClueTurnNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'ClueTurn'>;

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
        <View style={[styles.discussionIcon, { backgroundColor: `${colors.primary}22` }]}>
          <Icon name="message-circle" size={36} color={colors.primary} />
        </View>
        <Text style={[typography.title, styles.centerText, { color: colors.text }]}>
          {t('clueTurn.openDiscussion')}
        </Text>
        <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
          {t('clueTurn.discussionPrompt')}
        </Text>
        <Button title={t('clueTurn.startVote')} icon="flag" onPress={handleStartVote} style={styles.wideButton} />
      </View>
    );
  }

  return (
    <ScreenContainer center>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('clueTurn.round', { number: roundNumber })}
      </Text>
      <Text style={[typography.title, styles.centerText, { color: colors.text }]}>
        {t('clueTurn.turnOf', { name: currentPlayer?.name ?? t('clueTurn.unknownPlayer') })}
      </Text>
      <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
        {t('clueTurn.cluePrompt')}
      </Text>

      <View style={styles.timeline}>
        {activeOrder.map((playerId, index) => {
          const player = playersById.get(playerId);
          if (!player) return null;
          const isCurrent = playerId === currentTurnPlayerId;
          const isDone = index < currentIndex;
          const isLast = index === activeOrder.length - 1;

          return (
            <View key={playerId} style={styles.stepRow}>
              <View style={styles.stepIndicator}>
                <View
                  style={[
                    styles.avatarRing,
                    { backgroundColor: isCurrent ? `${colors.primary}22` : 'transparent' },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: player.color }]}>
                    {isDone ? (
                      <Icon name="check" size={14} color={getContrastTextColor(player.color)} />
                    ) : (
                      <Text style={[typography.caption, { color: getContrastTextColor(player.color) }]}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>
                {!isLast && <View style={[styles.connector, { backgroundColor: colors.border }]} />}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[typography.bodyStrong, { color: isCurrent ? colors.text : colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {player.name}
                </Text>
                {isCurrent && (
                  <Text style={[typography.caption, { color: colors.primary }]}>{t('clueTurn.speakingNow')}</Text>
                )}
                {isDone && <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('clueTurn.done')}</Text>}
              </View>
            </View>
          );
        })}
      </View>

      <Button
        title={isLastTurn ? t('clueTurn.startDiscussion') : t('clueTurn.nextPlayer')}
        icon={isLastTurn ? 'message-circle' : 'arrow-right'}
        onPress={handleNextTurn}
        style={styles.wideButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  discussionIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    width: '100%',
    marginTop: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: spacing.sm,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.md,
  },
  wideButton: {
    marginTop: spacing.lg,
    width: 280,
  },
});
