import type React from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography, useTheme } from '../theme';
import { Avatar } from './Avatar';

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
  const rowStyle = useMemo(
    () => ({
      backgroundColor: selected ? colors.primary : colors.surface,
      borderColor: selected ? colors.primary : colors.border,
      opacity: muted ? 0.5 : 1,
    }),
    [colors, selected, muted],
  );

  const body = (
    <View style={[styles.row, rowStyle]}>
      <Avatar name={name} color={color} />
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
  name: {
    flex: 1,
  },
});
