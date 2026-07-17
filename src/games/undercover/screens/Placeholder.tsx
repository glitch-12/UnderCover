import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography, useTheme } from '../../../shared/theme';

export function UndercoverPlaceholder() {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.subtitle, { color: colors.text }]}>
        Undercover lobby coming soon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
});
