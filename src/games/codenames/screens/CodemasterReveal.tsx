import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, PassDevicePrompt, ScreenContainer } from '../../../shared/components';
import { radii, spacing, typography, useTheme } from '../../../shared/theme';
import { CODENAMES_BOARD_COLUMNS } from '../config';
import { useCodenamesStore } from '../codenamesStore';
import type { CodenamesNavigatorParamList } from '../CodenamesNavigator';
import { getOwnerColor } from '../teamColor';
import { useCodenamesRoster } from '../useCodenamesRoster';
import { useConfirmEndGame } from '../useConfirmEndGame';

type NavigationProp = NativeStackNavigationProp<CodenamesNavigatorParamList, 'CodemasterReveal'>;

export function CodemasterReveal() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();
  useConfirmEndGame(navigation);

  const phase = useCodenamesStore((s) => s.phase);
  const cards = useCodenamesStore((s) => s.cards);
  const currentTeam = useCodenamesStore((s) => s.currentTeam);
  const confirmCodemasterRevealSeen = useCodenamesStore((s) => s.confirmCodemasterRevealSeen);
  const submitClue = useCodenamesStore((s) => s.submitClue);
  const { playersById, codemasters } = useCodenamesRoster();

  const [hasConfirmedIdentity, setHasConfirmedIdentity] = useState(false);
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState(1);
  const [clueError, setClueError] = useState<string | null>(null);

  // Re-entered every time it's this team's turn again — reset the
  // pass-device/clue-form walkthrough on every focus, not just at mount.
  useFocusEffect(
    useCallback(() => {
      setHasConfirmedIdentity(false);
      setClueWord('');
      setClueCount(1);
      setClueError(null);
    }, []),
  );

  const teamColor = getOwnerColor(colors, currentTeam);
  const codemasterId = codemasters[currentTeam];
  const codemasterPlayer = codemasterId ? playersById.get(codemasterId) : undefined;

  if (!codemasterPlayer) {
    return (
      <ScreenContainer center>
        <Text style={[typography.subtitle, { color: colors.text }]}>{t('codenames.codemasterReveal.noActiveGame')}</Text>
      </ScreenContainer>
    );
  }

  if (phase === 'codemasterReveal' && !hasConfirmedIdentity) {
    return (
      <ScreenContainer center>
        <PassDevicePrompt
          name={codemasterPlayer.name}
          color={codemasterPlayer.color}
          onConfirm={() => setHasConfirmedIdentity(true)}
        />
      </ScreenContainer>
    );
  }

  if (phase === 'codemasterReveal') {
    return (
      <ScreenContainer>
        <Text style={[typography.label, { color: teamColor }]}>{t(`codenames.team.${currentTeam}`)}</Text>
        <Text style={[typography.title, { color: colors.text }]}>{t('codenames.codemasterReveal.title')}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{t('codenames.codemasterReveal.hint')}</Text>

        <View style={styles.grid}>
          {cards.map((card) => {
            const ownerColor = getOwnerColor(colors, card.owner);
            const cellOpacity = card.revealed ? 0.5 : 1;
            return (
              <View
                key={card.id}
                style={[
                  styles.keyCell,
                  { backgroundColor: `${ownerColor}33`, borderColor: ownerColor, opacity: cellOpacity },
                ]}
              >
                <Text style={[typography.caption, styles.keyCellText, { color: colors.text }]} numberOfLines={2}>
                  {card.word}
                </Text>
              </View>
            );
          })}
        </View>

        <Button
          title={t('codenames.codemasterReveal.readyToClue')}
          icon="edit-3"
          onPress={() => confirmCodemasterRevealSeen()}
          style={styles.actionButton}
        />
      </ScreenContainer>
    );
  }

  function handleSubmitClue() {
    const result = submitClue(clueWord, clueCount);
    if (result.success) {
      navigation.navigate('Board');
    } else {
      setClueError(result.error ?? t('codenames.clueEntry.genericError'));
    }
  }

  return (
    <ScreenContainer center>
      <Text style={[typography.label, { color: teamColor }]}>{t(`codenames.team.${currentTeam}`)}</Text>
      <Text style={[typography.title, { color: colors.text }]}>{t('codenames.clueEntry.title')}</Text>
      <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
        {t('codenames.clueEntry.hint')}
      </Text>

      <TextInput
        value={clueWord}
        onChangeText={setClueWord}
        placeholder={t('codenames.clueEntry.wordPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        autoCapitalize="characters"
      />

      <View style={styles.stepperRow}>
        <Button
          title="−"
          variant="outline"
          onPress={() => setClueCount((c) => Math.max(0, c - 1))}
          style={styles.stepperButton}
        />
        <Text style={[typography.display, { color: colors.text }]}>{clueCount}</Text>
        <Button
          title="+"
          variant="outline"
          onPress={() => setClueCount((c) => Math.min(9, c + 1))}
          style={styles.stepperButton}
        />
      </View>

      {clueError && <Text style={[typography.caption, { color: colors.danger }]}>{clueError}</Text>}

      <Button title={t('codenames.clueEntry.submit')} icon="send" onPress={handleSubmitClue} style={styles.actionButton} />
    </ScreenContainer>
  );
}

const CELL_GAP = spacing.xs;

const styles = StyleSheet.create({
  centerText: {
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    marginTop: spacing.md,
  },
  keyCell: {
    width: `${100 / CODENAMES_BOARD_COLUMNS - 2}%`,
    aspectRatio: 1.3,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  keyCellText: {
    textAlign: 'center',
  },
  actionButton: {
    marginTop: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stepperButton: {
    width: 56,
    paddingHorizontal: spacing.sm,
  },
});
