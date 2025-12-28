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
    // Disable package exports to fix event-target-shim issue with LiveKit
    // This allows Metro to use file-based resolution instead of package.json exports
    // The warning is harmless - Metro uses file-based resolution as fallback
    unstable_enablePackageExports: false,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
