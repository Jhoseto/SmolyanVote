# 📋 Оставащи Задачи - SVMessenger Mobile

## ✅ НАПРАВЕНО (85%)

### Backend ✅ 100%
- ✅ JWT Authentication
- ✅ Mobile Auth endpoints
- ✅ WebSocket JWT
- ✅ Push Notifications setup (структура)

### React Native Core ✅ 100%
- ✅ Project Setup
- ✅ Design System
- ✅ Types
- ✅ State Management
- ✅ Navigation
- ✅ API Client
- ✅ WebSocket Client
- ✅ Hooks & Utils

### UI & Screens ✅ 100%
- ✅ Common Components
- ✅ Chat Components
- ✅ Login Screen
- ✅ Conversations List
- ✅ Chat Screen

---

## ⏳ ОСТАВА ДА СЕ НАПРАВИ

### 🔴 КРИТИЧНО (за основна функционалност)

#### 1. User Search Screen ⚠️ ВАЖНО
**Приоритет**: Висок
**Статус**: Не е направено

**Какво трябва**:
- [ ] Search Screen компонент
- [ ] Search API integration (`/api/svmessenger/users/search`)
- [ ] Start conversation от search
- [ ] Добавяне в MainNavigator като tab

**Файлове за създаване**:
- `src/screens/search/UserSearchScreen.tsx`
- `src/components/search/UserSearchItem.tsx`
- `src/services/api/searchService.ts` (опционално)

#### 2. Register Screen ⚠️ ВАЖНО
**Приоритет**: Висок
**Статус**: Не е направено

**Какво трябва**:
- [ ] Register Screen компонент
- [ ] Registration API integration
- [ ] Добавяне в AuthNavigator

**Файлове за създаване**:
- `src/screens/auth/RegisterScreen.tsx`

#### 3. Profile/Settings Screen ⚠️ ВАЖНО
**Приоритет**: Среден
**Статус**: Не е направено

**Какво трябва**:
- [ ] Profile Screen
- [ ] Settings Screen
- [ ] Logout функционалност
- [ ] Добавяне в MainNavigator като tab

**Файлове за създаване**:
- `src/screens/profile/ProfileScreen.tsx`
- `src/screens/settings/SettingsScreen.tsx`

#### 4. WebSocket Message Sending ⚠️ КРИТИЧНО
**Приоритет**: Много висок
**Статус**: Частично (само REST API)

**Какво трябва**:
- [ ] Изпращане на съобщения през WebSocket (`/app/svmessenger/send`)
- [ ] Актуализиране на `useMessages` hook
- [ ] Fallback към REST API ако WebSocket не работи

**Файлове за актуализиране**:
- `src/hooks/useMessages.ts`
- `src/services/websocket/stompClient.ts`

#### 5. Shadows в Theme ⚠️ ЛЕСНО
**Приоритет**: Нисък
**Статус**: Не е направено

**Какво трябва**:
- [ ] `src/theme/shadows.ts`
- [ ] Актуализиране на `src/theme/index.ts`

---

### 🟡 ВАЖНО (за пълна функционалност)

#### 6. Voice Calls (LiveKit) 🟡
**Приоритет**: Среден
**Статус**: Не е направено

**Какво трябва**:
- [ ] LiveKit client integration
- [ ] Call Screen
- [ ] Incoming Call Screen
- [ ] Call controls
- [ ] Call token generation (backend готов)

**Зависимости**:
- `react-native-livekit-client`
- `react-native-permissions` (за microphone)

#### 7. Push Notifications (Firebase) ✅
**Приоритет**: Среден
**Статус**: Android готов ✅, iOS pending (не се използва за сега)

**Какво е направено**:
- ✅ Firebase setup (Android)
- ✅ google-services.json добавен
- ✅ FCM token получване
- ✅ Device token registration при login
- ✅ Notification handling (foreground & background)
- ✅ Background notifications
- ✅ AndroidManifest.xml с notification permissions

**Какво остава (опционално за iOS)**:
- [ ] iOS Firebase setup (GoogleService-Info.plist)
- [ ] APNs certificate/key setup
- [ ] Badge count updates (iOS specific)

**Зависимости**:
- ✅ `@react-native-firebase/app` (инсталирано)
- ✅ `@react-native-firebase/messaging` (инсталирано)

#### 8. Offline Support 🟡
**Приоритет**: Среден
**Статус**: Не е направено

**Какво трябва**:
- [ ] Local message storage (AsyncStorage/SQLite)
- [ ] Offline message queue
- [ ] Sync при reconnect
- [ ] Offline indicator

---

### 🟢 ОПЦИОНАЛНО (за polish)

#### 9. Animations 🟢
**Приоритет**: Нисък
**Статус**: Не е направено

**Какво трябва**:
- [ ] Screen transitions
- [ ] Message animations
- [ ] Loading animations

**Зависимости**: Вече инсталирани (`react-native-reanimated`)

#### 10. Glassmorphism Effects 🟢
**Приоритет**: Нисък
**Статус**: Не е направено

**Какво трябва**:
- [ ] Glass effect компоненти
- [ ] Blur effects
- [ ] Gradient backgrounds

**Зависимости**: Вече инсталирани (`react-native-blur`, `react-native-linear-gradient`)

#### 11. Biometric Authentication 🟢
**Приоритет**: Нисък
**Статус**: Не е направено

**Какво трябва**:
- [ ] Face ID / Touch ID
- [ ] Fingerprint authentication
- [ ] Fallback to PIN

**Зависимости**: `react-native-biometrics`

#### 12. Message Features 🟢
**Приоритет**: Нисък
**Статус**: Не е направено

**Какво трябва**:
- [ ] Message editing
- [ ] Message deletion
- [ ] Image messages (optional)
- [ ] File sharing (optional)

---

### 🔵 TESTING & QA

#### 13. Unit Tests 🔵
**Приоритет**: Среден
**Статус**: Не е направено

**Какво трябва**:
- [ ] Service tests
- [ ] Utility function tests
- [ ] Hook tests

#### 14. Component Tests 🔵
**Приоритет**: Среден
**Статус**: Не е направено

**Какво трябва**:
- [ ] Component rendering tests
- [ ] User interaction tests

---

## 📊 Приоритетен Списък

### Първа Вълна (Критично за MVP)
1. ✅ **WebSocket Message Sending** - Изпращане на съобщения през WebSocket
2. ✅ **User Search Screen** - Търсене и започване на разговори
3. ✅ **Register Screen** - Регистрация на нови потребители
4. ✅ **Profile/Settings Screen** - Управление на профил и настройки

### Втора Вълна (Важно за пълна функционалност)
5. ✅ **Voice Calls** - LiveKit integration
6. ✅ **Push Notifications** - Firebase integration
7. ✅ **Offline Support** - Работа без интернет

### Трета Вълна (Polish & Enhancement)
8. ✅ **Animations** - UI animations
9. ✅ **Glassmorphism** - Visual effects
10. ✅ **Biometric Auth** - Security enhancement
11. ✅ **Message Features** - Editing, deletion, images

---

## 🎯 Препоръка

**За MVP (Minimum Viable Product)**:
1. WebSocket Message Sending ⚠️ **КРИТИЧНО**
2. User Search Screen
3. Register Screen
4. Profile Screen

**След това**:
5. Voice Calls
6. Push Notifications
7. Offline Support

**Най-накрая**:
8. Animations & Polish
9. Testing
10. Security hardening

---

## 📝 Забележки

- **Backend е 100% готов** - всички endpoints работят
- **Core infrastructure е 100% готов** - всички services и stores работят
- **Основната функционалност е 85% готова**
- **Остава главно UI screens и advanced features**

---

## ✅ Следваща Стъпка

**Препоръка**: Започни с **WebSocket Message Sending**, защото това е критично за основната функционалност на messenger-а.

