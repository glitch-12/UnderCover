import type React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getContrastTextColor, radii, spacing, typography, useTheme } from '../theme';

interface PlayerRowProps {
  name: string;
  color: string;
  onPress?: () => void;
  selected?: boolean;
  muted?: boolean;
  trailing?: React.ReactNode;
}

export function PlayerRow({ name, color, onPress, selected, muted, trailing }: PlayerRowProps) {
  const colors = useTheme();
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const body = (
    <View
      style={[
        styles.row,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: muted ? 0.5 : 1,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={[typography.caption, styles.initial, { color: getContrastTextColor(color) }]}>{initial}</Text>
      </View>
      <Text
        style={[typography.bodyStrong, styles.name, { color: selected ? colors.onPrimary : colors.text }]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {trailing}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '700',
  },
  name: {
    flex: 1,
  },
});
