import { Platform, ViewStyle } from 'react-native';

type Level = 'sm' | 'md' | 'lg';

const LEVELS: Record<Level, { offset: number; opacity: number; radius: number; android: number }> = {
  sm: { offset: 1, opacity: 0.16, radius: 3, android: 2 },
  md: { offset: 3, opacity: 0.2, radius: 8, android: 6 },
  lg: { offset: 6, opacity: 0.26, radius: 16, android: 12 },
};

export function elevation(level: Level): ViewStyle {
  const l = LEVELS[level];
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: l.offset },
      shadowOpacity: l.opacity,
      shadowRadius: l.radius,
    },
    android: { elevation: l.android },
    default: {},
  })!;
}
