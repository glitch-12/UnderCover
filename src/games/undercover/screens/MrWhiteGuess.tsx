import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoomStore } from '../../../core/room';
import { useTurnStore } from '../../../core/turn';
import { spacing, typography, useTheme } from '../../../shared/theme';
import { resolveWinCheckAndNavigate } from '../gameFlow';
import type { UndercoverStackParamList } from '../UndercoverNavigator';

type MrWhiteGuessNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'MrWhiteGuess'>;

const ON_PRIMARY_COLOR = '#FFFFFF';

function normalize(word: string): string {
  return word.trim().toLowerCase();
}

export function MrWhiteGuess() {
  const navigation = useNavigation<MrWhiteGuessNavigationProp>();
  const colors = useTheme();

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
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.title, styles.centerText, { color: colors.text }]}>
          {result === 'correct' ? 'Correct!' : 'Not quite.'}
        </Text>
        <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
          The word was "{civilianWord}".
        </Text>
        <Pressable onPress={handleContinue} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
          <Text style={[typography.subtitle, styles.onPrimaryText]}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <Text style={[typography.title, styles.centerText, { color: colors.text }]}>Mr. White's last chance</Text>
      <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
        {mrWhitePlayer?.name ?? 'Mr. White'}, guess the Civilians' word to steal the win.
      </Text>
      <TextInput
        value={guess}
        onChangeText={setGuess}
        placeholder="Your guess"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleSubmitGuess}
      />
      <Pressable
        onPress={handleSubmitGuess}
        disabled={!canSubmit}
        style={[styles.actionButton, { backgroundColor: canSubmit ? colors.primary : colors.border }]}
      >
        <Text style={[typography.subtitle, { color: canSubmit ? ON_PRIMARY_COLOR : colors.textSecondary }]}>
          Submit Guess
        </Text>
      </Pressable>
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
  input: {
    width: 280,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    marginTop: spacing.md,
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
