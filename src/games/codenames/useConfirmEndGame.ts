import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import type { RootStackParamList } from '../../app/Navigation';
import { useCodenamesStore } from './codenamesStore';
import type { CodenamesNavigatorParamList } from './CodenamesNavigator';

// Same mid-game "leave with confirmation" pattern as the Undercover module's
// useConfirmEndGame (games/undercover/useConfirmEndGame.ts), reimplemented
// here rather than shared because it's wired to this game's own store and
// navigator param types.
export const BACK_ACTION_TYPES = new Set(['GO_BACK', 'POP']);

type CodenamesNavigation = NativeStackNavigationProp<CodenamesNavigatorParamList, keyof CodenamesNavigatorParamList>;

export function useConfirmEndGame(navigation: CodenamesNavigation): void {
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
          useCodenamesStore.getState().reset();
          navigation.reset({ index: 0, routes: [{ name: 'TeamSetup' }] });
        },
      },
      {
        text: t('common.endGame'),
        style: 'destructive',
        onPress: () => {
          useCodenamesStore.getState().reset();
          navigation
            .getParent<NativeStackNavigationProp<RootStackParamList>>()
            ?.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  });
}
