module.exports = {
  preset: '@react-native/jest-preset',
  // These packages ship untranspiled ES modules, so jest has to transform them too
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-native-firebase|@react-native-masked-view|@react-navigation|@tanstack|react-native-[^/]+)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
