export const darkColors = {
  background: '#0C0C10',
  surface: '#18181F',
  surfaceElevated: '#202029',
  text: '#F5F5F7',
  textSecondary: '#9C9CA8',
  primary: '#9B8AFB',
  onPrimary: '#14121F',
  border: '#2B2B35',
  success: '#3ED9A0',
  danger: '#F5566B',
  warning: '#F2B84B',
};

export const lightColors = {
  background: '#FAFAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#111114',
  textSecondary: '#65656F',
  primary: '#6552E0',
  onPrimary: '#FFFFFF',
  border: '#E4E4EA',
  success: '#1F9D6D',
  danger: '#E1435B',
  warning: '#C98A1D',
};

export type ThemeColors = typeof lightColors & { isDark: boolean };

export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#14121F' : '#FFFFFF';
}
