import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  center?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ScreenContainer({ children, center, contentContainerStyle }: ScreenContainerProps) {
  const colors = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, center && styles.center, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
