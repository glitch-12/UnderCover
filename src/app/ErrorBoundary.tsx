import { Component } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRoomStore } from '../core/room';
import { useTurnStore } from '../core/turn';
import { Button, Icon } from '../shared/components';
import { spacing, typography, useTheme } from '../shared/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const colors = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Icon name="alert-triangle" size={40} color={colors.danger} />
      <Text style={[typography.title, styles.centerText, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[typography.body, styles.centerText, { color: colors.textSecondary }]}>
        The game hit an unexpected error. Restarting will take you back to the start screen.
      </Text>
      <Button title="Restart" icon="refresh-cw" onPress={onReset} style={styles.button} />
    </View>
  );
}

// Top-level safety net: without this, any uncaught error deep in a screen
// (e.g. a corrupted content-deck state) crashes the whole app with no
// recovery. Wrapping just the navigator (not the whole tree) so it can
// remount cleanly on reset without re-mounting providers like SafeAreaProvider.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReset = () => {
    useRoomStore.getState().reset();
    useTurnStore.getState().reset();
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    width: 240,
  },
});
