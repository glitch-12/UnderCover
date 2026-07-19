import type { Role } from '../../core/types';
import type { ThemeColors } from './colors';

export function getRoleColor(colors: ThemeColors, role: Role): string {
  switch (role) {
    case 'civilian':
      return colors.success;
    case 'undercover':
      return colors.danger;
    case 'mrWhite':
      return colors.warning;
    default:
      return colors.primary;
  }
}
