import type { TextStyle } from 'react-native';

export const typography: Record<'title' | 'subtitle' | 'body' | 'caption', TextStyle> = {
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
};
