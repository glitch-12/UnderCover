import type React from 'react';
import Feather from 'react-native-vector-icons/Feather';

export type IconName = React.ComponentProps<typeof Feather>['name'];

export const Icon = Feather;
