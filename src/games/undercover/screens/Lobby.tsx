import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { isRoomReadyForGame, useRoomStore } from '../../../core/room';
import { spacing, typography, useTheme } from '../../../shared/theme';
import { UNDERCOVER_MAX_PLAYERS, UNDERCOVER_MIN_PLAYERS, undercoverVariants } from '../config';
import type { UndercoverVariantId } from '../config';
import { startUndercoverRound } from '../gameFlow';
import { setLastVariantId } from '../gameSession';
import type { UndercoverStackParamList } from '../UndercoverNavigator';

type LobbyNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'Lobby'>;

const PLAYER_COLORS = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#8B7CF6', '#F78C6B'];
const ERROR_COLOR = '#EF476F';
const ON_PRIMARY_COLOR = '#FFFFFF';

export function Lobby() {
  const navigation = useNavigation<LobbyNavigationProp>();
  const colors = useTheme();
  const { t } = useTranslation();

  const players = useRoomStore((s) => s.players);
  const addPlayer = useRoomStore((s) => s.addPlayer);
  const removePlayer = useRoomStore((s) => s.removePlayer);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<UndercoverVariantId>('classic');

  const readiness = isRoomReadyForGame(players, UNDERCOVER_MIN_PLAYERS, UNDERCOVER_MAX_PLAYERS);
  const canStart = readiness.success;

  function handleAddPlayer() {
    const result = addPlayer(name, PLAYER_COLORS[players.length % PLAYER_COLORS.length], UNDERCOVER_MAX_PLAYERS);
    if (result.success) {
      setName('');
      setError(null);
    } else {
      setError(result.error ?? 'Could not add player');
    }
  }

  function handleStart() {
    if (!canStart) return;

    setLastVariantId(variantId);
    startUndercoverRound(variantId);
    navigation.navigate('RoleReveal');
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[typography.subtitle, { color: colors.text }]}>{t('lobby.playersTitle')}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('lobby.playersCount', {
          count: players.length,
          max: UNDERCOVER_MAX_PLAYERS,
          min: UNDERCOVER_MIN_PLAYERS,
        })}
      </Text>

      <View style={styles.addRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleAddPlayer}
          placeholder={t('lobby.playerNamePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleAddPlayer}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[typography.body, styles.addButtonText]}>{t('lobby.add')}</Text>
        </Pressable>
      </View>

      {error && <Text style={[typography.caption, { color: ERROR_COLOR }]}>{error}</Text>}

      <View style={styles.playerList}>
        {players.map((player) => (
          <View
            key={player.id}
            style={[styles.playerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.colorSwatch, { backgroundColor: player.color }]} />
            <Text style={[typography.body, styles.playerName, { color: colors.text }]}>{player.name}</Text>
            <Pressable onPress={() => removePlayer(player.id)}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{t('lobby.remove')}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={[typography.subtitle, styles.sectionTitle, { color: colors.text }]}>{t('lobby.variantTitle')}</Text>
      <View style={styles.variantList}>
        {undercoverVariants.map((variant) => {
          const selected = variant.id === variantId;
          const cardBackground = selected ? colors.primary : colors.surface;
          const titleColor = selected ? ON_PRIMARY_COLOR : colors.text;
          const captionColor = selected ? ON_PRIMARY_COLOR : colors.textSecondary;
          return (
            <Pressable
              key={variant.id}
              onPress={() => setVariantId(variant.id)}
              style={[styles.variantCard, { backgroundColor: cardBackground, borderColor: cardBackground }]}
            >
              <Text style={[typography.body, styles.variantCardTitle, { color: titleColor }]}>{variant.name}</Text>
              <Text style={[typography.caption, { color: captionColor }]}>{variant.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleStart}
        disabled={!canStart}
        style={[styles.startButton, { backgroundColor: canStart ? colors.primary : colors.border }]}
      >
        <Text style={[typography.subtitle, { color: canStart ? ON_PRIMARY_COLOR : colors.textSecondary }]}>
          {t('lobby.startGame')}
        </Text>
      </Pressable>
      {!canStart && (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{readiness.error}</Text>
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
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButton: {
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  playerList: {
    gap: spacing.xs,
  },
  playerRow: {
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
  sectionTitle: {
    marginTop: spacing.md,
  },
  variantList: {
    gap: spacing.sm,
  },
  variantCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  variantCardTitle: {
    fontWeight: '600',
  },
  startButton: {
    marginTop: spacing.lg,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
});
