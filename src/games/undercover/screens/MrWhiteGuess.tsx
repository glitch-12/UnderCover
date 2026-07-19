import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import { Button, Icon } from '../../../shared/components';
import { radii, spacing, typography, useTheme } from '../../../shared/theme';
import { resolveWinCheckAndNavigate } from '../gameFlow';
import type { UndercoverStackParamList } from '../UndercoverNavigator';
import { useConfirmEndGame } from '../useConfirmEndGame';

type MrWhiteGuessNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'MrWhiteGuess'>;

function normalize(word: string): string {
  return word.trim().toLowerCase();
}

export function MrWhiteGuess() {
  const navigation = useNavigation<MrWhiteGuessNavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();
  useConfirmEndGame(navigation);

  const players = useRoomStore((s) => s.players);
  const roleAssignments = useTurnStore((s) => s.roleAssignments);
  const eliminatedPlayerIds = useTurnStore((s) => s.eliminatedPlayerIds);
  const resolveMrWhiteGuess = useTurnStore((s) => s.resolveMrWhiteGuess);

  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);

  // Re-entered on every "Play Again" that happens to eliminate Mr. White
  // again — the screen stays mounted, so clear the previous game's guess.
  useFocusEffect(
    useCallback(() => {
      setGuess('');
      setResult(null);
    }, []),
  );

  const mrWhiteId = eliminatedPlayerIds[eliminatedPlayerIds.length - 1];
  const mrWhitePlayer = players.find((p) => p.id === mrWhiteId);
  const civilianWord = roleAssignments.find((a) => a.role === 'civilian')?.word ?? '';
  const canSubmit = guess.trim().length > 0;

  function handleSubmitGuess() {
    if (!canSubmit) return;
    const correct = normalize(guess) === normalize(civilianWord);
    resolveMrWhiteGuess(correct);
    setResult(correct ? 'correct' : 'incorrect');
  }

  function handleContinue() {
    if (result === 'correct') {
      navigation.navigate('GameOver');
      return;
    }
    resolveWinCheckAndNavigate(navigation);
  }

  if (result) {
    const isCorrect = result === 'correct';
    const resultColor = isCorrect ? colors.success : colors.danger;
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.resultIcon, { backgroundColor: `${resultColor}22` }]}>
          <Icon name={isCorrect ? 'check-circle' : 'x-circle'} size={40} color={resultColor} />
        </View>
        <Text style={[typography.title, styles.centerText, { color: colors.text }]}>
          {isCorrect ? t('mrWhiteGuess.correct') : t('mrWhiteGuess.incorrect')}
        </Text>
        <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
          {t('mrWhiteGuess.wordWas', { word: civilianWord })}
        </Text>
        <Button title={t('common.continue')} icon="arrow-right" onPress={handleContinue} style={styles.actionButton} />
      </View>
    );
  }

  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <View style={[styles.promptIcon, { backgroundColor: `${colors.warning}22` }]}>
        <Icon name="help-circle" size={40} color={colors.warning} />
      </View>
      <Text style={[typography.title, styles.centerText, { color: colors.text }]}>{t('mrWhiteGuess.title')}</Text>
      <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
        {t('mrWhiteGuess.prompt', { name: mrWhitePlayer?.name ?? t('mrWhiteGuess.defaultName') })}
      </Text>
      <TextInput
        value={guess}
        onChangeText={setGuess}
        placeholder={t('mrWhiteGuess.guessPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleSubmitGuess}
      />
      <Button
        title={t('mrWhiteGuess.submitGuess')}
        icon="send"
        onPress={handleSubmitGuess}
        disabled={!canSubmit}
        style={styles.actionButton}
      />
    </View>
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
  promptIcon: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: 280,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    marginTop: spacing.md,
    width: 280,
  },
});
