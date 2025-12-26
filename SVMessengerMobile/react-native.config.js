module.exports = {
  dependencies: {
    // react-native-webrtc should be auto-linked by default in React Native 0.83+
    // No explicit configuration needed - autolinkLibrariesWithApp() handles it
    // If autolinking fails, you can manually configure here:
    // 'react-native-webrtc': {
    //   platforms: {
    //     android: {
    //       sourceDir: '../node_modules/react-native-webrtc/android',
    //       packageImportPath: 'import io.webrtc.library.WebRTCModulePackage;',
    //     },
    //   },
    // },
  },
  // Project configuration
  project: {
    android: {},
    ios: {},
  },
};
