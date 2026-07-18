module.exports = {
  preset: '@react-native/jest-preset',
  resolver: 'react-native-worklets/jest/resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*)/)',
  ],
  setupFiles: [
    require.resolve('@react-native/jest-preset/jest/setup.js'),
    require.resolve('react-native-gesture-handler/jestSetup.js'),
  ],
};
