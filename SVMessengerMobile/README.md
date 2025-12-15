# 📱 SVMessenger Mobile

Мобилно приложение за SVMessenger - React Native приложение на световно ниво.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- React Native CLI
- Android Studio (за Android development)
- Xcode (за iOS development, само на macOS)

### Installation

```bash
# Install dependencies
npm install

# iOS (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## 📁 Project Structure

```
SVMessengerMobile/
├── src/
│   ├── config/          # Configuration files
│   ├── services/         # Business logic services
│   │   ├── api/         # API client
│   │   ├── auth/         # Authentication
│   │   └── websocket/    # WebSocket/STOMP
│   ├── theme/            # Design system
│   ├── components/       # Reusable components
│   ├── screens/          # Screen components
│   └── navigation/       # Navigation setup
├── android/              # Android native code
└── ios/                  # iOS native code
```

## 🔧 Configuration

### API Configuration

Edit `src/config/api.ts` to configure API endpoints:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:2662', // Development
  WS_URL: 'ws://localhost:2662/ws-svmessenger',
  // ...
};
```

### Environment Variables

Create `.env` file for environment-specific configuration:

```
API_BASE_URL=http://localhost:2662
WS_URL=ws://localhost:2662/ws-svmessenger
```

## 🏗️ Architecture

- **State Management**: Zustand
- **API Client**: Axios with interceptors
- **WebSocket**: STOMP over WebSocket
- **Navigation**: React Navigation
- **Storage**: Keychain (tokens) + EncryptedStorage (sensitive data)

## 🔐 Security

- JWT tokens stored in Keychain (iOS) / Keystore (Android)
- Encrypted storage for sensitive data
- HTTPS/WSS only in production
- Certificate pinning (production)

## 📝 Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm test
```

## 📦 Build

### Android

```bash
cd android && ./gradlew assembleRelease
```

### iOS

```bash
cd ios && xcodebuild -workspace SVMessengerMobile.xcworkspace -scheme SVMessengerMobile -configuration Release
```

## 🐛 Troubleshooting

### Metro bundler issues

```bash
npm start -- --reset-cache
```

### Android build issues

```bash
cd android && ./gradlew clean
```

### iOS build issues

```bash
cd ios && pod deintegrate && pod install
```

## 📄 License

Private - SmolyanVote
