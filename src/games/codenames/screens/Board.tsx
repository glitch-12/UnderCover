import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, ScreenContainer } from '../../../shared/components';
import { radii, spacing, typography, useTheme } from '../../../shared/theme';
import { CODENAMES_BOARD_COLUMNS } from '../config';
import { useCodenamesStore } from '../codenamesStore';
import type { CodenamesNavigatorParamList } from '../CodenamesNavigator';
import { getOwnerColor } from '../teamColor';
import { useConfirmEndGame } from '../useConfirmEndGame';

type NavigationProp = NativeStackNavigationProp<CodenamesNavigatorParamList, 'Board'>;

export function Board() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();
  useConfirmEndGame(navigation);

  const phase = useCodenamesStore((s) => s.phase);
  const cards = useCodenamesStore((s) => s.cards);
  const currentTeam = useCodenamesStore((s) => s.currentTeam);
  const currentClue = useCodenamesStore((s) => s.currentClue);
  const guessesRemaining = useCodenamesStore((s) => s.guessesRemaining);
  const guessCard = useCodenamesStore((s) => s.guessCard);
  const endTurn = useCodenamesStore((s) => s.endTurn);
  const continueToNextTeam = useCodenamesStore((s) => s.continueToNextTeam);

  const teamColor = getOwnerColor(colors, currentTeam);
  const isGuessing = phase === 'guessing';

  function handleGuess(cardId: string) {
    if (!isGuessing) return;
    guessCard(cardId);
    if (useCodenamesStore.getState().phase === 'gameOver') {
      navigation.navigate('GameOver');
    }
  }

  function handleContinueToNextTeam() {
    continueToNextTeam();
    navigation.navigate('CodemasterReveal');
  }

  return (
    <ScreenContainer>
      {isGuessing && currentClue ? (
        <View style={[styles.clueBanner, { backgroundColor: `${teamColor}18`, borderColor: `${teamColor}55` }]}>
          <Text style={[typography.label, { color: teamColor }]}>
            {t(`codenames.team.${currentTeam}`)} · {t('codenames.board.clueLabel')}
          </Text>
          <Text style={[typography.title, { color: colors.text }]}>
            {currentClue.word.toUpperCase()} · {currentClue.count}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('codenames.board.guessesLeft', { count: guessesRemaining })}
          </Text>
        </View>
      ) : (
        <View style={[styles.clueBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[typography.title, { color: colors.text }]}>{t('codenames.board.turnOverTitle')}</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>{t('codenames.board.turnOverHint')}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {cards.map((card) => {
          const revealedColor = card.revealed ? getOwnerColor(colors, card.owner) : null;
          const cellOpacity = !isGuessing && !card.revealed ? 0.6 : 1;
          return (
            <Pressable
              key={card.id}
              disabled={!isGuessing || card.revealed}
              onPress={() => handleGuess(card.id)}
              style={[
                styles.cell,
                {
                  backgroundColor: revealedColor ? `${revealedColor}33` : colors.surface,
                  borderColor: revealedColor ?? colors.border,
                  opacity: cellOpacity,
                },
              ]}
            >
              <Text
                style={[typography.caption, styles.cellText, { color: revealedColor ?? colors.text }]}
                numberOfLines={2}
              >
                {card.word}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isGuessing ? (
        <Button title={t('codenames.board.endTurn')} icon="flag" variant="outline" onPress={endTurn} style={styles.actionButton} />
      ) : (
        <Button
          title={t('codenames.board.continue')}
          icon="arrow-right"
          onPress={handleContinueToNextTeam}
          style={styles.actionButton}
        />
      )}
    </ScreenContainer>
  );
}

const CELL_GAP = spacing.xs;

const styles = StyleSheet.create({
  clueBanner: {
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    marginTop: spacing.md,
  },
  cell: {
    width: `${100 / CODENAMES_BOARD_COLUMNS - 2}%`,
    aspectRatio: 1.3,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellText: {
    textAlign: 'center',
  },
  actionButton: {
    marginTop: spacing.lg,
  },
});
