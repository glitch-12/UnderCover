import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClueTurn, GameOver, Lobby, MrWhiteGuess, RoleReveal, Vote } from './screens';

export type UndercoverStackParamList = {
  Lobby: undefined;
  RoleReveal: undefined;
  ClueTurn: undefined;
  Vote: undefined;
  MrWhiteGuess: undefined;
  GameOver: undefined;
};

export type UndercoverScreenProps<Screen extends keyof UndercoverStackParamList> = NativeStackScreenProps<
  UndercoverStackParamList,
  Screen
>;

const Stack = createNativeStackNavigator<UndercoverStackParamList>();

export function UndercoverNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Lobby" component={Lobby} options={{ title: 'Undercover' }} />
      <Stack.Screen name="RoleReveal" component={RoleReveal} options={{ title: 'Reveal' }} />
      <Stack.Screen name="ClueTurn" component={ClueTurn} options={{ title: 'Clues' }} />
      <Stack.Screen name="Vote" component={Vote} options={{ title: 'Vote' }} />
      <Stack.Screen name="MrWhiteGuess" component={MrWhiteGuess} options={{ title: 'Mr. White' }} />
      <Stack.Screen name="GameOver" component={GameOver} options={{ title: 'Game Over' }} />
    </Stack.Navigator>
  );
}
