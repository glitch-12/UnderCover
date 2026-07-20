import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../shared/theme';
import { Board, CodemasterReveal, CodenamesRules, GameOver, TeamSetup } from './screens';

export type CodenamesNavigatorParamList = {
  TeamSetup: undefined;
  CodemasterReveal: undefined;
  Board: undefined;
  GameOver: undefined;
  Rules: undefined;
};

export type CodenamesScreenProps<Screen extends keyof CodenamesNavigatorParamList> = NativeStackScreenProps<
  CodenamesNavigatorParamList,
  Screen
>;

const Stack = createNativeStackNavigator<CodenamesNavigatorParamList>();

export function CodenamesNavigator() {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="TeamSetup" component={TeamSetup} options={{ title: 'Codenames' }} />
      <Stack.Screen name="CodemasterReveal" component={CodemasterReveal} options={{ title: t('codenames.codemasterReveal.headerTitle') }} />
      <Stack.Screen name="Board" component={Board} options={{ title: t('codenames.board.headerTitle') }} />
      <Stack.Screen name="GameOver" component={GameOver} options={{ title: t('codenames.gameOver.headerTitle') }} />
      <Stack.Screen name="Rules" component={CodenamesRules} options={{ title: t('codenames.rules.headerTitle') }} />
    </Stack.Navigator>
  );
}
