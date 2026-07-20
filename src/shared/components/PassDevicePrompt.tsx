import { useTranslation } from 'react-i18next';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { getContrastTextColor, radii, spacing, typography, useTheme } from '../theme';
import { Button } from './Button';
import { Icon } from './Icon';

interface PassDevicePromptProps {
  name: string;
  color: string;
  onConfirm: () => void;
  style?: StyleProp<ViewStyle>;
}

export function PassDevicePrompt({ name, color, onConfirm, style }: PassDevicePromptProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.panel, { backgroundColor: `${color}14`, borderColor: `${color}40` }, style]}>
      <View style={styles.avatarWrapper}>
        <View style={[styles.glowRing, styles.glowOuter, { backgroundColor: `${color}18` }]} />
        <View style={[styles.glowRing, styles.glowInner, { backgroundColor: `${color}2A` }]} />
        <View style={styles.avatarInner}>
          <View style={[styles.avatar, { backgroundColor: color }]}>
            <Text style={[typography.display, { color: getContrastTextColor(color) }]}>{initial}</Text>
          </View>
          <View style={[styles.deviceBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.background }]}>
            <Icon name="smartphone" size={14} color={colors.textSecondary} />
          </View>
        </View>
      </View>

      <Text style={[typography.caption, styles.centerText, { color: colors.textSecondary }]}>
        {t('common.passDeviceTo')}
      </Text>
      <Text style={[typography.display, styles.centerText, { color: colors.text }]}>{name}</Text>
      <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
        {t('common.areYouSure', { name })}
      </Text>

      <Button title={t('common.yesThatsMe')} icon="user-check" onPress={onConfirm} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  centerText: {
    textAlign: 'center',
  },
  avatarWrapper: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  glowRing: {
    position: 'absolute',
    borderRadius: radii.pill,
  },
  glowOuter: {
    width: 168,
    height: 168,
  },
  glowInner: {
    width: 132,
    height: 132,
  },
  avatarInner: {
    width: 92,
    height: 92,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: spacing.sm,
  },
});
