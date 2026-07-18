// Manual Jest mock for react-native-mmkv (picked up automatically for any
// node_modules package of the same name — see Jest docs on manual mocks).
// The real package requires native Nitro Module bindings that don't exist
// under Jest, so tests get a lightweight in-memory stand-in instead.

function createMMKV() {
  const store = new Map();
  return {
    set: (key, value) => {
      store.set(key, value);
    },
    getString: (key) => store.get(key),
    getBoolean: (key) => store.get(key),
    getNumber: (key) => store.get(key),
    getBuffer: (key) => store.get(key),
    contains: (key) => store.has(key),
    remove: (key) => store.delete(key),
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => store.clear(),
  };
}

module.exports = { createMMKV };
