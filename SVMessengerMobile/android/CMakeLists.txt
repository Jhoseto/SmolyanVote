# CMakeLists.txt for React Native Android x86_64 support

cmake_minimum_required(VERSION 3.4.1)

# Set the ABI to x86_64
set(ANDROID_ABI x86_64)

# Force static linking for STL
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17 -fexceptions -frtti")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=c11")

# Add React Native specific flags
add_definitions(-DANDROID)
add_definitions(-DANDROID_ABI=${ANDROID_ABI})

# Ensure x86_64 compatibility
if (${ANDROID_ABI} STREQUAL "x86_64")
    add_definitions(-D__x86_64__)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=x86-64 -mtune=intel")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -march=x86-64 -mtune=intel")
endif()

# Include React Native CMake
include(${CMAKE_SOURCE_DIR}/../node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake)
