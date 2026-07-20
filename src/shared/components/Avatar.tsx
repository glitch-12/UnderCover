import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { getContrastTextColor, radii, typography } from '../theme';
import { Icon } from './Icon';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  checked?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ name, color, size = 32, checked, style }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const textColor = getContrastTextColor(color);

  return (
    <View style={[styles.avatar, { width: size, height: size, backgroundColor: color }, style]}>
      {checked ? (
        <Icon name="check" size={Math.round(size * 0.44)} color={textColor} />
      ) : (
        <Text style={[typography.caption, styles.initial, { color: textColor }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '700',
  },
});
