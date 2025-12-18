module.exports = {
  dependencies: {
    // This library is causing issues with Codegen/CMake.
    '@react-native-community/blur': {
      platforms: {
        android: {
          componentDescriptors: [],
          cmakeListsPath: null,
        },
      },
    },
  },
};
