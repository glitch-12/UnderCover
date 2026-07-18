import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
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
// dispatches a 'NAVIGATE' action, so it passes through untouched.
export const BACK_ACTION_TYPES = new Set(['GO_BACK', 'POP']);

export function useConfirmEndGame(navigation: UndercoverNavigation): void {
  const { t } = useTranslation();

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!BACK_ACTION_TYPES.has(e.data.action.type)) return;
      e.preventDefault();

      Alert.alert(t('common.endGameTitle'), t('common.endGameMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.newGame'),
          onPress: () => {
            useTurnStore.getState().reset();
            navigation.navigate('Lobby');
          },
        },
        {
          text: t('common.endGame'),
          style: 'destructive',
          onPress: () => {
            useTurnStore.getState().reset();
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Home');
          },
        },
      ]);
    });
  }, [navigation, t]);
}
