import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTurnStore } from '../../../core/turn';
import { Button, Icon, PassDevicePrompt } from '../../../shared/components';
import { getContrastTextColor, getRoleColor, radii, spacing, typography, useTheme } from '../../../shared/theme';
import type { UndercoverStackParamList } from '../UndercoverNavigator';
import { useConfirmEndGame } from '../useConfirmEndGame';
import { useRoster } from '../useRoster';

type RoleRevealNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'RoleReveal'>;

type Stage = 'confirm' | 'hidden' | 'revealed';

export function RoleReveal() {
  const navigation = useNavigation<RoleRevealNavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();
  useConfirmEndGame(navigation);

  const confirmRoleAssignmentComplete = useTurnStore((s) => s.confirmRoleAssignmentComplete);
  const { turnOrder, playersById, assignmentsByPlayerId } = useRoster();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('confirm');
  const [hasRevealed, setHasRevealed] = useState(false);
  const rotation = useSharedValue(0);
  // Guards against a fast double-tap on "Pass to Next Player" firing
  // handleContinue twice before the re-render that swaps this player's view
  // away — without it, currentIndex advances by 2 and one player is skipped.
  const continueLockRef = useRef(false);

  // This screen is re-entered on every "Play Again", but React Navigation
  // keeps it mounted and pops back to the existing instance — so reset the
  // walkthrough on every focus rather than only at mount.
  useFocusEffect(
    useCallback(() => {
      setCurrentIndex(0);
      setStage('confirm');
      setHasRevealed(false);
      rotation.value = 0;
      continueLockRef.current = false;
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
    continueLockRef.current = false;
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
    if (continueLockRef.current) return;
    continueLockRef.current = true;

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
  const roleColor = getRoleColor(colors, currentAssignment.role);
  const roleTextColor = getContrastTextColor(roleColor);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {stage === 'confirm' ? (
        <View style={styles.centered}>
          <PassDevicePrompt name={currentPlayer.name} color={currentPlayer.color} onConfirm={handleConfirmIdentity} />
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('roleReveal.turnOf', { name: currentPlayer.name })}
          </Text>

          <View style={styles.glowWrapper}>
            <View style={[styles.glowRing, styles.glowOuter, { backgroundColor: `${colors.primary}14` }]} />
            <View style={[styles.glowRing, styles.glowInner, { backgroundColor: `${colors.primary}22` }]} />

            <Pressable onPress={handleFlip} style={styles.cardWrapper}>
              <Animated.View
                style={[styles.card, styles.cardFace, frontStyle, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Icon name="eye" size={40} color={colors.primary} />
                <Text style={[typography.subtitle, { color: colors.text }]}>{t('roleReveal.tapToReveal')}</Text>
              </Animated.View>
              <Animated.View
                style={[styles.card, styles.cardFace, styles.cardBack, backStyle, { backgroundColor: roleColor }]}
              >
                <Text style={[typography.label, { color: roleTextColor }]}>{t(`roleReveal.role.${currentAssignment.role}`)}</Text>
                <Text style={[typography.display, styles.word, { color: roleTextColor }]}>
                  {currentAssignment.word ?? t('roleReveal.noWordBluff')}
                </Text>
                <Text style={[typography.caption, { color: roleTextColor }]}>{t('roleReveal.tapToHide')}</Text>
              </Animated.View>
            </Pressable>
          </View>

          <Button
            title={isLastPlayer ? t('roleReveal.startCluePhase') : t('roleReveal.passToNextPlayer')}
            icon={isLastPlayer ? 'play' : 'arrow-right'}
            onPress={handleContinue}
            disabled={!canContinue}
            style={styles.continueButton}
          />
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
  glowWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: radii.pill,
  },
  glowOuter: {
    width: 360,
    height: 360,
  },
  glowInner: {
    width: 300,
    height: 300,
  },
  cardWrapper: {
    width: 280,
    height: 380,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: radii.xl,
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
    width: 280,
  },
});
