import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography, useTheme } from '../theme';
import { Card } from './Card';
import { ScreenContainer } from './ScreenContainer';

export interface RuleBookSection {
  heading: string;
  body: string;
}

interface RuleBookProps {
  title: string;
  intro?: string;
  sections: RuleBookSection[];
}

// Generic "how to play" screen: any GameModule can render this with its own
// title/intro/sections, so a new game gets a rule book for free instead of
// building its own screen.
export function RuleBook({ title, intro, sections }: RuleBookProps) {
  const colors = useTheme();

  return (
    <ScreenContainer>
      <Text style={[typography.title, { color: colors.text }]}>{title}</Text>
      {intro && <Text style={[typography.body, styles.intro, { color: colors.textSecondary }]}>{intro}</Text>}

      <View style={styles.sectionList}>
        {sections.map((section, index) => (
          <Fragment key={section.heading}>
            <Card style={styles.sectionCard}>
              <Text style={[typography.label, { color: colors.primary }]}>{`${index + 1}`}</Text>
              <Text style={[typography.subtitle, { color: colors.text }]}>{section.heading}</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{section.body}</Text>
            </Card>
          </Fragment>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: spacing.xs,
  },
  sectionList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionCard: {
    gap: spacing.xs,
  },
});
