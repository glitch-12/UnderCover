import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import { Button, Icon, ScreenContainer } from '../../../shared/components';
import { radii, spacing, typography, useTheme } from '../../../shared/theme';
import { resolveWinCheckAndNavigate } from '../gameFlow';
import type { UndercoverStackParamList } from '../UndercoverNavigator';
import { useConfirmEndGame } from '../useConfirmEndGame';

type VoteNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'Vote'>;

interface Tally {
  counts: Map<string, number>;
  topCandidates: string[];
  isTie: boolean;
}

function tallyVotes(candidates: string[], roundVotes: Record<string, string>): Tally {
  const counts = new Map<string, number>();
  for (const candidateId of candidates) counts.set(candidateId, 0);
  for (const targetId of Object.values(roundVotes)) {
    counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  }
  const maxVotes = Math.max(...counts.values());
  const topCandidates = candidates.filter((id) => counts.get(id) === maxVotes);
  return { counts, topCandidates, isTie: topCandidates.length > 1 };
}

function advanceAfterElimination(eliminatedId: string, navigation: VoteNavigationProp) {
  const store = useTurnStore.getState();
  store.eliminatePlayer(eliminatedId);
  store.continueAfterElimination();

  if (useTurnStore.getState().phase === 'mrWhiteGuess') {
    navigation.navigate('MrWhiteGuess');
    return;
  }

  resolveWinCheckAndNavigate(navigation);
}

export function Vote() {
  const navigation = useNavigation<VoteNavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();
  useConfirmEndGame(navigation);

  const players = useRoomStore((s) => s.players);
  const turnOrder = useTurnStore((s) => s.turnOrder);
  const eliminatedPlayerIds = useTurnStore((s) => s.eliminatedPlayerIds);
  const roleAssignments = useTurnStore((s) => s.roleAssignments);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const assignmentsByPlayerId = useMemo(() => new Map(roleAssignments.map((a) => [a.playerId, a])), [roleAssignments]);
  const activeOrder = useMemo(
    () => turnOrder.filter((id) => !eliminatedPlayerIds.includes(id)),
    [turnOrder, eliminatedPlayerIds],
  );

  const [voterOrder, setVoterOrder] = useState<string[]>(activeOrder);
  const [candidates, setCandidates] = useState<string[]>(activeOrder);
  const [roundVotes, setRoundVotes] = useState<Record<string, string>>({});
  const [voterIndex, setVoterIndex] = useState(0);
  const [confirmStage, setConfirmStage] = useState(true);
  const [phase, setPhase] = useState<'voting' | 'tally'>('voting');

  // This screen is re-entered every voting round within a game (and again on
  // "Play Again"), but React Navigation keeps the screen instance mounted —
  // so reset local voting state on every focus rather than only at mount.
  useFocusEffect(
    useCallback(() => {
      const freshActiveOrder = useTurnStore
        .getState()
        .turnOrder.filter((id) => !useTurnStore.getState().eliminatedPlayerIds.includes(id));
      setVoterOrder(freshActiveOrder);
      setCandidates(freshActiveOrder);
      setRoundVotes({});
      setVoterIndex(0);
      setConfirmStage(true);
      setPhase('voting');
    }, []),
  );

  const tally = phase === 'tally' ? tallyVotes(candidates, roundVotes) : null;
  const sortedCandidates = useMemo(() => {
    if (!tally) return candidates;
    return [...candidates].sort((a, b) => (tally.counts.get(b) ?? 0) - (tally.counts.get(a) ?? 0));
  }, [candidates, tally]);
  const maxVotes = tally ? Math.max(1, ...candidates.map((id) => tally.counts.get(id) ?? 0)) : 1;

  if (activeOrder.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.subtitle, { color: colors.text }]}>{t('vote.noActivePlayers')}</Text>
      </View>
    );
  }

  const currentVoterId = voterOrder[voterIndex];
  const currentVoter = playersById.get(currentVoterId);

  function handleConfirmVoterIdentity() {
    setConfirmStage(false);
  }

  function handleCastVote(targetId: string) {
    const nextVotes = { ...roundVotes, [currentVoterId]: targetId };
    setRoundVotes(nextVotes);

    if (voterIndex === voterOrder.length - 1) {
      setPhase('tally');
    } else {
      setVoterIndex((i) => i + 1);
      setConfirmStage(true);
    }
  }

  function handleRevote() {
    if (!tally) return;
    setCandidates(tally.topCandidates);
    setVoterOrder(activeOrder);
    setRoundVotes({});
    setVoterIndex(0);
    setConfirmStage(true);
    setPhase('voting');
  }

  const eliminatedId = tally && !tally.isTie ? tally.topCandidates[0] : null;
  const eliminatedPlayer = eliminatedId ? playersById.get(eliminatedId) : undefined;
  const eliminatedAssignment = eliminatedId ? assignmentsByPlayerId.get(eliminatedId) : undefined;

  return (
    <ScreenContainer>
      {phase === 'voting' && confirmStage && (
        <View style={styles.centered}>
          <Icon name="smartphone" size={28} color={colors.textSecondary} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('common.passDeviceTo')}</Text>
          <Text style={[typography.title, styles.centerText, { color: colors.text }]}>{currentVoter?.name}</Text>
          <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
            {t('common.areYouSure', { name: currentVoter?.name })}
          </Text>
          <Button
            title={t('common.yesThatsMe')}
            icon="user-check"
            onPress={handleConfirmVoterIdentity}
            style={styles.actionButton}
          />
        </View>
      )}

      {phase === 'voting' && !confirmStage && (
        <View style={styles.votingBlock}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('vote.voteToEliminate', { name: currentVoter?.name })}
          </Text>
          {candidates
            .filter((id) => id !== currentVoterId)
            .map((candidateId) => {
              const candidate = playersById.get(candidateId);
              if (!candidate) return null;
              return (
                <Pressable
                  key={candidateId}
                  onPress={() => handleCastVote(candidateId)}
                  style={[styles.candidateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.accentBar, { backgroundColor: candidate.color }]} />
                  <Text style={[typography.bodyStrong, styles.candidateName, { color: colors.text }]}>{candidate.name}</Text>
                  <Icon name="target" size={18} color={colors.textSecondary} />
                </Pressable>
              );
            })}
        </View>
      )}

      {phase === 'tally' && tally && (
        <View style={styles.centered}>
          <Text style={[typography.title, styles.centerText, { color: colors.text }]}>{t('vote.votesAreIn')}</Text>
          <View style={styles.tallyList}>
            {sortedCandidates.map((candidateId) => {
              const candidate = playersById.get(candidateId);
              if (!candidate) return null;
              const count = tally.counts.get(candidateId) ?? 0;
              const isTop = tally.topCandidates.includes(candidateId);
              const barColor = isTop ? (tally.isTie ? colors.warning : colors.primary) : colors.textSecondary;
              return (
                <View key={candidateId} style={styles.tallyRow}>
                  <View style={styles.tallyHeader}>
                    <Text style={[typography.body, { color: colors.text }]}>{candidate.name}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {t('vote.voteCount', { count })}
                    </Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(4, (count / maxVotes) * 100)}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {tally.isTie ? (
            <>
              <View style={[styles.tieBanner, { backgroundColor: `${colors.warning}22`, borderColor: colors.warning }]}>
                <Icon name="alert-triangle" size={16} color={colors.warning} />
                <Text style={[typography.caption, styles.tieText, { color: colors.warning }]}>
                  {t('vote.tie', {
                    names: tally.topCandidates.map((id) => playersById.get(id)?.name).join(' and '),
                  })}
                </Text>
              </View>
              <Button title={t('vote.revote')} icon="rotate-cw" onPress={handleRevote} style={styles.actionButton} />
            </>
          ) : (
            <>
              <Text style={[typography.subtitle, styles.centerText, { color: colors.text }]}>
                {t('vote.wasRole', {
                  name: eliminatedPlayer?.name,
                  role: eliminatedAssignment ? t(`vote.role.${eliminatedAssignment.role}`) : t('gameOver.unknownRole'),
                })}
              </Text>
              <Button
                title={t('common.continue')}
                icon="arrow-right"
                onPress={() => eliminatedId && advanceAfterElimination(eliminatedId, navigation)}
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  centerText: {
    textAlign: 'center',
  },
  votingBlock: {
    gap: spacing.sm,
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radii.pill,
  },
  candidateName: {
    flex: 1,
  },
  tallyList: {
    width: '100%',
    gap: spacing.md,
  },
  tallyRow: {
    gap: spacing.xs,
  },
  tallyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barTrack: {
    height: 8,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  tieBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    width: '100%',
  },
  tieText: {
    flex: 1,
  },
  actionButton: {
    marginTop: spacing.lg,
    width: 280,
  },
});
