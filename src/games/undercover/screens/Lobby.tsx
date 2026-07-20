import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isRoomReadyForGame, useRoomStore } from '../../../core/room';
import { Button, Card, Icon, PlayerRow, ScreenContainer, type IconName } from '../../../shared/components';
import { radii, spacing, typography, useTheme } from '../../../shared/theme';
import { UNDERCOVER_MAX_PLAYERS, UNDERCOVER_MIN_PLAYERS, undercoverVariants } from '../config';
import type { UndercoverVariantId } from '../config';
import { startUndercoverRound } from '../gameFlow';
import { setLastVariantId } from '../gameSession';
import type { UndercoverStackParamList } from '../UndercoverNavigator';

type LobbyNavigationProp = NativeStackNavigationProp<UndercoverStackParamList, 'Lobby'>;

const PLAYER_COLORS = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#8B7CF6', '#F78C6B'];

const VARIANT_ICONS: Record<UndercoverVariantId, IconName> = {
  classic: 'shield',
  mrWhite: 'help-circle',
  multiUndercover: 'users',
};

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
  // Guards against a fast double-tap (or Enter-then-tap) on Add firing
  // handleAddPlayer twice before the re-render that clears `name` — without
  // it, both calls read the same stale name and add two identical players.
  const lastAddRef = useRef<{ name: string; time: number } | null>(null);

  const readiness = isRoomReadyForGame(players, UNDERCOVER_MIN_PLAYERS, UNDERCOVER_MAX_PLAYERS);
  const canStart = readiness.success;

  function handleAddPlayer() {
    const trimmedName = name.trim();
    const lastAdd = lastAddRef.current;
    if (lastAdd && lastAdd.name === trimmedName && Date.now() - lastAdd.time < 500) return;

    const result = addPlayer(name, PLAYER_COLORS[players.length % PLAYER_COLORS.length], UNDERCOVER_MAX_PLAYERS);
    if (result.success) {
      lastAddRef.current = { name: trimmedName, time: Date.now() };
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
    <ScreenContainer>
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
          <Icon name="plus" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={14} color={colors.danger} />
          <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      <View style={styles.playerList}>
        {players.map((player) => (
          <PlayerRow
            key={player.id}
            name={player.name}
            color={player.color}
            trailing={
              <Pressable onPress={() => removePlayer(player.id)} hitSlop={8}>
                <Icon name="trash-2" size={18} color={colors.textSecondary} />
              </Pressable>
            }
          />
        ))}
      </View>

      <Text style={[typography.subtitle, styles.sectionTitle, { color: colors.text }]}>{t('lobby.variantTitle')}</Text>
      <View style={styles.variantList}>
        {undercoverVariants.map((variant) => {
          const selected = variant.id === variantId;
          return (
            <Card key={variant.id} onPress={() => setVariantId(variant.id)} selected={selected} style={styles.variantCard}>
              <View style={styles.variantRow}>
                <Icon name={VARIANT_ICONS[variant.id]} size={18} color={selected ? colors.onPrimary : colors.primary} />
                <Text style={[typography.bodyStrong, styles.variantTitle, { color: selected ? colors.onPrimary : colors.text }]}>
                  {variant.name}
                </Text>
                {selected && <Icon name="check-circle" size={18} color={colors.onPrimary} />}
              </View>
              <Text style={[typography.caption, { color: selected ? colors.onPrimary : colors.textSecondary }]}>
                {variant.description}
              </Text>
            </Card>
          );
        })}
      </View>

      <Button
        title={t('lobby.startGame')}
        icon="play"
        onPress={handleStart}
        disabled={!canStart}
        style={styles.startButton}
      />
      {!canStart && (
        <Text style={[typography.caption, styles.hintText, { color: colors.textSecondary }]}>{readiness.error}</Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  playerList: {
    gap: spacing.xs,
  },
  sectionTitle: {
    marginTop: spacing.md,
  },
  variantList: {
    gap: spacing.sm,
  },
  variantCard: {
    gap: spacing.xs,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  variantTitle: {
    flex: 1,
  },
  startButton: {
    marginTop: spacing.lg,
  },
  hintText: {
    textAlign: 'center',
  },
});
