import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import type { Role } from '../../../core/types';
import { spacing, typography, useTheme } from '../../../shared/theme';
import { resolveWinCheckAndNavigate } from '../gameFlow';
import type { UndercoverStackParamList } from '../UndercoverNavigator';

type VoteNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'Vote'>;

const ON_PRIMARY_COLOR = '#FFFFFF';

const ROLE_REVEAL_LABEL: Record<Role, string> = {
  civilian: 'a Civilian',
  undercover: 'the Undercover',
  mrWhite: 'Mr. White',
};

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

  if (activeOrder.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.subtitle, { color: colors.text }]}>No active players to vote.</Text>
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {phase === 'voting' && confirmStage && (
        <View style={styles.centered}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Pass the device to</Text>
          <Text style={[typography.title, styles.centerText, { color: colors.text }]}>{currentVoter?.name}</Text>
          <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
            Are you sure you're {currentVoter?.name}?
          </Text>
          <Pressable onPress={handleConfirmVoterIdentity} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Text style={[typography.subtitle, styles.onPrimaryText]}>Yes, that's me</Text>
          </Pressable>
        </View>
      )}

      {phase === 'voting' && !confirmStage && (
        <View style={styles.votingBlock}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{currentVoter?.name}, vote to eliminate:</Text>
          {candidates
            .filter((id) => id !== currentVoterId)
            .map((candidateId) => {
              const candidate = playersById.get(candidateId);
              if (!candidate) return null;
              return (
                <Pressable
                  key={candidateId}
                  onPress={() => handleCastVote(candidateId)}
                  style={[styles.candidateRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: candidate.color }]} />
                  <Text style={[typography.body, { color: colors.text }]}>{candidate.name}</Text>
                </Pressable>
              );
            })}
        </View>
      )}

      {phase === 'tally' && tally && (
        <View style={styles.centered}>
          <Text style={[typography.title, styles.centerText, { color: colors.text }]}>Votes are in</Text>
          <View style={styles.tallyList}>
            {candidates.map((candidateId) => {
              const candidate = playersById.get(candidateId);
              if (!candidate) return null;
              return (
                <View key={candidateId} style={[styles.tallyRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={[typography.body, { color: colors.text }]}>{candidate.name}</Text>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{tally.counts.get(candidateId) ?? 0} vote(s)</Text>
                </View>
              );
            })}
          </View>

          {tally.isTie ? (
            <>
              <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
                It's a tie between {tally.topCandidates.map((id) => playersById.get(id)?.name).join(' and ')} — revote!
              </Text>
              <Pressable onPress={handleRevote} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
                <Text style={[typography.subtitle, styles.onPrimaryText]}>Revote</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[typography.subtitle, styles.centerText, { color: colors.text }]}>
                {eliminatedPlayer?.name} was {eliminatedAssignment ? ROLE_REVEAL_LABEL[eliminatedAssignment.role] : 'unknown'}!
              </Text>
              <Pressable
                onPress={() => eliminatedId && advanceAfterElimination(eliminatedId, navigation)}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[typography.subtitle, styles.onPrimaryText]}>Continue</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
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
  },
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
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  tallyList: {
    width: '100%',
    gap: spacing.xs,
  },
  tallyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
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
