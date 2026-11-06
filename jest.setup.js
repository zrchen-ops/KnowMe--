// Jest setup: the app persists through AsyncStorage, which has no native module under Node.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
