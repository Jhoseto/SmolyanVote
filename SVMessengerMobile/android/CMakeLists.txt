# CMakeLists.txt for React Native Android x86_64 support with SHARED STL

cmake_minimum_required(VERSION 3.4.1)

# Force shared STL for x86_64 architecture to fix Hermes compatibility
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17 -fexceptions -frtti")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=c11")

# For x86_64, ensure we use shared STL
if (${ANDROID_ABI} STREQUAL "x86_64")
    # Force shared STL linking
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -lc++_shared")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -lc++_shared")

    # Add x86_64 specific flags
    add_definitions(-D__x86_64__)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=x86-64")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -march=x86-64")
endif()

# Include React Native CMake
include(${CMAKE_SOURCE_DIR}/../node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake)