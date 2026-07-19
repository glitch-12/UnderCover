import type { Role } from '../../core/types';
import { StyleSheet, Text, View } from 'react-native';
import { getRoleColor, radii, spacing, typography, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

const ROLE_ICON: Record<Role, IconName> = {
  civilian: 'users',
  undercover: 'eye-off',
  mrWhite: 'help-circle',
};

interface RoleBadgeProps {
  role: Role;
  label: string;
}

export function RoleBadge({ role, label }: RoleBadgeProps) {
  const colors = useTheme();
  const roleColor = getRoleColor(colors, role);

  return (
    <View style={[styles.badge, { backgroundColor: `${roleColor}26`, borderColor: roleColor }]}>
      <Icon name={ROLE_ICON[role]} size={12} color={roleColor} />
      <Text style={[typography.label, { color: roleColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
});
