import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { UndercoverNavigator } from '../games/undercover/UndercoverNavigator';
import { Home } from './screens';

export type RootStackParamList = {
  Home: undefined;
  Undercover: undefined;
};

export type RootScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={Home}
        options={{ title: 'Undercover' }}
      />
      <Stack.Screen
        name="Undercover"
        component={UndercoverNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
