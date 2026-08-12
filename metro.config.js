const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
/**
 * Keep Metro's file watcher out of the Android native build output. CMake creates
 * and deletes scratch dirs under `android/app/.cxx` while Gradle runs, and on Windows
 * the watcher crashes with ENOENT trying to watch one that just disappeared.
 */
const config = {
  resolver: {
    blockList: /[\\/]android[\\/](\.gradle|\.cxx|app[\\/](\.cxx|build))[\\/].*/,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
