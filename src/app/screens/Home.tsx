import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, typography, useTheme } from '../../shared/theme';
import { gameModules } from '../gameRegistry';
import type { RootStackParamList } from '../Navigation';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.title, { color: colors.text }]}>Game Hub</Text>
      {gameModules.map((module) => (
        <Pressable
          key={module.id}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => navigation.navigate(module.route)}
        >
          <Text style={[typography.subtitle, { color: colors.text }]}>
            {module.name}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {module.description}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
});
