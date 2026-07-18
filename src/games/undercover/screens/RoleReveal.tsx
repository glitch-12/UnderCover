import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import { spacing, typography, useTheme } from '../../../shared/theme';
import type { UndercoverStackParamList } from '../UndercoverNavigator';
import { useConfirmEndGame } from '../useConfirmEndGame';

type RoleRevealNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'RoleReveal'>;

type Stage = 'confirm' | 'hidden' | 'revealed';

const ON_PRIMARY_COLOR = '#FFFFFF';

export function RoleReveal() {
  const navigation = useNavigation<RoleRevealNavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();
  useConfirmEndGame(navigation);

  const players = useRoomStore((s) => s.players);
  const turnOrder = useTurnStore((s) => s.turnOrder);
  const roleAssignments = useTurnStore((s) => s.roleAssignments);
  const confirmRoleAssignmentComplete = useTurnStore((s) => s.confirmRoleAssignmentComplete);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const assignmentsByPlayerId = useMemo(() => new Map(roleAssignments.map((a) => [a.playerId, a])), [roleAssignments]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('confirm');
  const [hasRevealed, setHasRevealed] = useState(false);
  const rotation = useSharedValue(0);

  // This screen is re-entered on every "Play Again", but React Navigation
  // keeps it mounted and pops back to the existing instance — so reset the
  // walkthrough on every focus rather than only at mount.
  useFocusEffect(
    useCallback(() => {
      setCurrentIndex(0);
      setStage('confirm');
      setHasRevealed(false);
      rotation.value = 0;
    }, [rotation]),
  );

  // All hooks must run before any early return, so these animated styles are
  // computed unconditionally even though they're only rendered once a game
  // is active (see the guard clauses below).
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    opacity: rotation.value >= 90 ? 0 : 1,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value - 180}deg` }],
    opacity: rotation.value >= 90 ? 1 : 0,
  }));

  if (turnOrder.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.subtitle, { color: colors.text }]}>{t('roleReveal.noActiveGame')}</Text>
      </View>
    );
  }

  const currentPlayerId = turnOrder[currentIndex];
  const currentPlayer = playersById.get(currentPlayerId);
  const currentAssignment = assignmentsByPlayerId.get(currentPlayerId);
  const isLastPlayer = currentIndex === turnOrder.length - 1;

  if (!currentPlayer || !currentAssignment) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.subtitle, { color: colors.text }]}>{t('roleReveal.playerLoadError')}</Text>
      </View>
    );
  }

  function handleConfirmIdentity() {
    setStage('hidden');
  }

  function handleFlip() {
    if (stage === 'hidden') {
      rotation.value = withTiming(180, { duration: 350 });
      setStage('revealed');
      setHasRevealed(true);
    } else if (stage === 'revealed') {
      rotation.value = withTiming(0, { duration: 350 });
      setStage('hidden');
    }
  }

  function handleContinue() {
    if (isLastPlayer) {
      confirmRoleAssignmentComplete();
      navigation.navigate('ClueTurn');
      return;
    }
    setCurrentIndex((i) => i + 1);
    setStage('confirm');
    setHasRevealed(false);
    rotation.value = 0;
  }

  const canContinue = stage === 'hidden' && hasRevealed;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {stage === 'confirm' ? (
        <View style={styles.centered}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('common.passDeviceTo')}</Text>
          <Text style={[typography.title, styles.playerName, { color: colors.text }]}>{currentPlayer.name}</Text>
          <Text style={[typography.body, styles.confirmPrompt, { color: colors.textSecondary }]}>
            {t('common.areYouSure', { name: currentPlayer.name })}
          </Text>
          <Pressable
            onPress={handleConfirmIdentity}
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[typography.subtitle, styles.onPrimaryText]}>{t('common.yesThatsMe')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('roleReveal.turnOf', { name: currentPlayer.name })}
          </Text>

          <Pressable onPress={handleFlip} style={styles.cardWrapper}>
            <Animated.View
              style={[styles.card, styles.cardFace, frontStyle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[typography.subtitle, { color: colors.text }]}>{t('roleReveal.tapToReveal')}</Text>
            </Animated.View>
            <Animated.View
              style={[styles.card, styles.cardFace, styles.cardBack, backStyle, { backgroundColor: colors.primary }]}
            >
              <Text style={[typography.caption, styles.onPrimaryText]}>
                {t(`roleReveal.role.${currentAssignment.role}`)}
              </Text>
              <Text style={[typography.title, styles.word, styles.onPrimaryText]}>
                {currentAssignment.word ?? t('roleReveal.noWordBluff')}
              </Text>
              <Text style={[typography.caption, styles.onPrimaryText]}>{t('roleReveal.tapToHide')}</Text>
            </Animated.View>
          </Pressable>

          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            style={[styles.continueButton, { backgroundColor: canContinue ? colors.primary : colors.border }]}
          >
            <Text style={[typography.subtitle, { color: canContinue ? ON_PRIMARY_COLOR : colors.textSecondary }]}>
              {isLastPlayer ? t('roleReveal.startCluePhase') : t('roleReveal.passToNextPlayer')}
            </Text>
          </Pressable>
          {!canContinue && (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('roleReveal.revealHint')}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  playerName: {
    textAlign: 'center',
  },
  confirmPrompt: {
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: spacing.md,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  onPrimaryText: {
    color: ON_PRIMARY_COLOR,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardWrapper: {
    width: 280,
    height: 380,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardFace: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    borderWidth: 0,
  },
  word: {
    textAlign: 'center',
  },
  continueButton: {
    marginTop: spacing.lg,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    width: 280,
  },
});
