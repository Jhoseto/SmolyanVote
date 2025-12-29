const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration - OPTIMIZED FOR FAST STARTUP
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    // Enable inline requires for faster startup
    inlineRequires: true,
  },
  resolver: {
    // Enable source map support
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    // Disable strict package exports checking to suppress event-target-shim warnings
    // This allows Metro to use file-based resolution as fallback
    unstable_enablePackageExports: false,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
