import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { elevation, radii, spacing, useTheme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  elevationLevel?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, selected, elevationLevel = 'sm', style }: CardProps) {
  const colors = useTheme();

  const body = (
    <View
      style={[
        styles.base,
        elevation(elevationLevel),
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
});
