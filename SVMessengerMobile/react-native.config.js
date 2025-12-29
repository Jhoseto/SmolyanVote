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
    
    // Exclude modules from CMake build that don't have codegen directories
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-async-storage/async-storage/android',
          packageImportPath: 'import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;',
          // Don't include in CMake build if codegen directory doesn't exist
        },
      },
    },
  },
  // Project configuration
  project: {
    android: {},
    ios: {},
  },
};
