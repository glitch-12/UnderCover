import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../shared/components';
import { elevation, radii, spacing, typography, useTheme } from '../../shared/theme';
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

      <View style={[styles.headerRule, { backgroundColor: colors.border }]} />

      <Text style={[typography.label, styles.sectionLabel, { color: colors.textSecondary }]}>Games</Text>
      <View style={styles.gameList}>
        {gameModules.map((module) => (
          <Pressable
            key={module.id}
            onPress={() => navigation.navigate(module.route)}
            style={({ pressed }) => [
              styles.row,
              styles.card,
              elevation('md'),
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}22` }]}>
              <Icon name={module.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[typography.subtitle, { color: colors.text }]}>{module.name}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{module.description}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
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
    gap: spacing.xs,
  },
  headerRule: {
    height: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    marginTop: spacing.xs,
  },
  gameList: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
