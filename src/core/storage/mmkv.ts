import { createMMKV, type MMKV } from 'react-native-mmkv';

export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
}

let instance: MMKV | null = null;

function getMmkv(): MMKV {
  if (!instance) {
    instance = createMMKV({ id: 'undercover-storage' });
  }
  return instance;
}

export const mmkvStore: KeyValueStore = {
  getString: (key) => getMmkv().getString(key),
  set: (key, value) => getMmkv().set(key, value),
};
