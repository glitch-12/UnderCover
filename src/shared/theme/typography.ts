import type { TextStyle } from 'react-native';

export const typography: Record<
  'display' | 'title' | 'subtitle' | 'body' | 'bodyStrong' | 'caption' | 'label',
  TextStyle
> = {
  display: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 19, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodyStrong: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
};
