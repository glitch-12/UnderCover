import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Icon } from '../../shared/components';
import { radii, spacing, typography, useTheme } from '../../shared/theme';
import { gameModules } from '../gameRegistry';
import type { RootStackParamList } from '../Navigation';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[typography.label, { color: colors.textSecondary }]}>Party Game Hub</Text>
        <Text style={[typography.display, { color: colors.text }]}>Undercover</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Pick a game to start playing</Text>
      </View>

      {gameModules.map((module) => (
        <Card key={module.id} onPress={() => navigation.navigate(module.route)} elevationLevel="md" style={styles.card}>
          <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}22` }]}>
            <Icon name={module.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={[typography.subtitle, { color: colors.text }]}>{module.name}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{module.description}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textSecondary} />
        </Card>
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
  header: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
});
