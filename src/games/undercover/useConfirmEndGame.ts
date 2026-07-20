import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import type { RootStackParamList } from '../../app/Navigation';
import { useTurnStore } from '../../core/turn';
import type { UndercoverNavigation } from './gameFlow';

// Intercepts back navigation (header button, hardware back, swipe gesture)
// on mid-game screens and offers New Game / End Game instead of silently
// losing round state. Native-stack's header back button and Android's
// hardware back both dispatch a 'POP' action; goBack() dispatches 'GO_BACK'
// — both mean "the user is trying to leave". Programmatic round-progression
// navigation (Play Again, next round) also pops screens off the stack, but
// dispatches a 'NAVIGATE' action, so it's re-dispatched through untouched.
//
// This uses `usePreventRemove` rather than a raw `beforeRemove` listener +
// `preventDefault()`, because native-stack only partially supports that
// pattern directly (React Navigation logs a "removed natively but didn't
// get removed from JS state" warning otherwise).
export const BACK_ACTION_TYPES = new Set(['GO_BACK', 'POP']);

export function useConfirmEndGame(navigation: UndercoverNavigation): void {
  const { t } = useTranslation();

  usePreventRemove(true, ({ data }) => {
    if (!BACK_ACTION_TYPES.has(data.action.type)) {
      navigation.dispatch(data.action);
      return;
    }

    Alert.alert(t('common.endGameTitle'), t('common.endGameMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.newGame'),
        onPress: () => {
          useTurnStore.getState().reset();
          // `navigate` would push a second Lobby on top of the current
          // screen instead of clearing it, leaving stale mid-game screens
          // reachable by going back. Reset the stack so Lobby is the only
          // entry.
          navigation.reset({ index: 0, routes: [{ name: 'Lobby' }] });
        },
      },
      {
        text: t('common.endGame'),
        style: 'destructive',
        onPress: () => {
          useTurnStore.getState().reset();
          navigation
            .getParent<NativeStackNavigationProp<RootStackParamList>>()
            ?.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  });
}
