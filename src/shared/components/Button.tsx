import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { elevation, radii, spacing, typography, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', disabled, icon, style }: ButtonProps) {
  const colors = useTheme();

  const background = disabled
    ? colors.border
    : variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.surfaceElevated
        : 'transparent';
  const borderColor = disabled ? colors.border : variant === 'outline' ? colors.border : background;
  const textColor = disabled ? colors.textSecondary : variant === 'primary' ? colors.onPrimary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && !disabled && elevation('md'),
        { backgroundColor: background, borderColor, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={18} color={textColor} />}
      <Text style={[typography.subtitle, styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
});
