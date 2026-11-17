/* eslint-env jest */
// Native modules do not exist in jest, so each one is replaced by a small stand-in.

require('react-native-gesture-handler/jestSetup');

// Reanimated needs its native worklets runtime, so only the pieces this app uses are replaced
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  const entering = { duration: () => entering, delay: () => entering, springify: () => entering };
  const Animated = {
    View: RN.View,
    Text: RN.Text,
    ScrollView: RN.ScrollView,
    Image: RN.Image,
    createAnimatedComponent: component => component,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: value => ({ value }),
    useAnimatedStyle: factory => factory(),
    withTiming: (value, _config, callback) => {
      if (callback) callback(true);
      return value;
    },
    withSpring: value => value,
    withDelay: (_delay, value) => value,
    runOnJS: fn => fn,
    Easing: { out: fn => fn, in: fn => fn, inOut: fn => fn, bezier: () => () => 0, cubic: () => 0, quad: () => 0, linear: () => 0 },
    FadeIn: entering,
    FadeInUp: entering,
    FadeInDown: entering,
    FadeInLeft: entering,
    FadeInRight: entering,
    SlideInUp: entering,
    SlideInDown: entering,
    SlideInLeft: entering,
    SlideInRight: entering,
    ZoomIn: entering,
    ZoomOut: entering,
  };
});

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: fn => fn(),
  runOnJS: fn => fn,
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async key => (key in store ? store[key] : null)),
      setItem: jest.fn(async (key, value) => {
        store[key] = String(value);
      }),
      removeItem: jest.fn(async key => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      multiGet: jest.fn(async keys => keys.map(key => [key, store[key] ?? null])),
      multiRemove: jest.fn(async keys => {
        keys.forEach(key => delete store[key]);
      }),
    },
  };
});

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
  ACCESSIBLE: { WHEN_UNLOCKED: 'AccessibleWhenUnlocked' },
}));

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => 'test-token'),
  deleteToken: jest.fn(async () => {}),
  onMessage: jest.fn(() => () => {}),
  onTokenRefresh: jest.fn(() => () => {}),
  onNotificationOpenedApp: jest.fn(() => () => {}),
  getInitialNotification: jest.fn(async () => null),
  requestPermission: jest.fn(async () => 1),
  registerDeviceForRemoteMessages: jest.fn(async () => {}),
  isDeviceRegisteredForRemoteMessages: jest.fn(() => true),
  setBackgroundMessageHandler: jest.fn(),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}));

jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-video', () => 'Video');
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn(async () => '') }));
jest.mock('react-native-blob-util', () => ({}));
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
  launchCamera: jest.fn(async () => ({ didCancel: true })),
}));
jest.mock('@react-native-masked-view/masked-view', () => 'MaskedView');
