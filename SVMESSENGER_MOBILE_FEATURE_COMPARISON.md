# 📱 SVMessenger Mobile - План за Допълване на Функционалности

## 🔍 СРАВНЕНИЕ: Web vs Mobile

### ✅ ФУНКЦИОНАЛНОСТИ В WEB ВЕРСИЯТА

#### 1. **СЪОБЩЕНИЯ (Messages)**
- ✅ Emoji Picker (`SVEmojiPicker`) - **ЛИПСВА В МОБИЛНАТА**
- ✅ File Attachments (бутон за attach, но TODO в кода) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Edit Message (`editMessage` API) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Delete Message (`deleteMessage` API) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Message Search в чат (`SVChatSearch`) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Message Thread View (`SVMessageThread`) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Infinite Scroll (`useSVInfiniteScroll`) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Message Sounds (notification sound) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Read Receipts (bulk и single) - ✅ ИМА В МОБИЛНАТА
- ✅ Delivery Receipts (bulk и single) - ✅ ИМА В МОБИЛНАТА
- ✅ Typing Indicators - ✅ ИМА В МОБИЛНАТА
- ✅ Online Status Updates - ✅ ИМА В МОБИЛНАТА

#### 2. **РАЗГОВОРИ (Conversations)**
- ✅ Delete Conversation (`deleteConversation` API) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Hide Conversation (`hideConversation` API) - **ЛИПСВА В МОБИЛНАТА**
- ✅ Conversation Search в conversation list - **ЛИПСВА В МОБИЛНАТА**
- ✅ Multiple Chat Windows (draggable, resizable) - **НЕ Е ПРИЛОЖИМО ЗА МОБИЛНА**
- ✅ Taskbar за minimized chats - **НЕ Е ПРИЛОЖИМО ЗА МОБИЛНА**
- ✅ Drag and Drop за chat windows - **НЕ Е ПРИЛОЖИМО ЗА МОБИЛНА**
- ✅ Resize за chat windows - **НЕ Е ПРИЛОЖИМО ЗА МОБИЛНА**

#### 3. **ОБАЖДАНЯ (Calls)**
- ✅ Audio Device Selector (`SVAudioDeviceSelector`) - **ЛИПСВА В МОБИЛНАТА**
  - Microphone selection
  - Speaker selection
  - Camera selection (за video calls)
  - Volume controls
  - Audio visualization
- ✅ Call Modal с различни състояния - ✅ ИМА В МОБИЛНАТА (IncomingCallScreen, CallScreen)
- ✅ Call Indicator когато има popup прозорец - **НЕ Е ПРИЛОЖИМО ЗА МОБИЛНА**
- ✅ Video Calls - **ЛИПСВА В МОБИЛНАТА** (има placeholder)

#### 4. **ТЪРСЕНЕ (Search)**
- ✅ User Search - ✅ ИМА В МОБИЛНАТА
- ✅ Following Users Panel в user search - **ЛИПСВА В МОБИЛНАТА**
- ✅ Search в conversation list - **ЛИПСВА В МОБИЛНАТА**
- ✅ Search в chat window - **ЛИПСВА В МОБИЛНАТА**

#### 5. **НОТИФИКАЦИИ (Notifications)**
- ✅ Browser Notifications - **НЕ Е ПРИЛОЖИМО ЗА МОБИЛНА** (използваме Push Notifications)
- ✅ Message Sounds - **ЛИПСВА В МОБИЛНАТА**

#### 6. **НАСТРОЙКИ (Settings)**
- ✅ Settings Screen - **ЛИПСВА В МОБИЛНАТА** (има placeholder в ProfileScreen)
- ✅ Notification Settings - **ЛИПСВА В МОБИЛНАТА**
- ✅ Privacy Settings - **ЛИПСВА В МОБИЛНАТА**
- ✅ Audio Settings - **ЛИПСВА В МОБИЛНАТА**

---

### ✅ ФУНКЦИОНАЛНОСТИ В МОБИЛНАТА ВЕРСИЯТА

#### 1. **МОБИЛНИ СПЕЦИФИЧНИ**
- ✅ Push Notifications (Firebase) - **НЕ Е В WEB ВЕРСИЯТА**
- ✅ Offline Indicator - **НЕ Е В WEB ВЕРСИЯТА**
- ✅ Network Status Detection - **НЕ Е В WEB ВЕРСИЯТА**
- ✅ Message Storage (local storage) - **НЕ Е В WEB ВЕРСИЯТА**
- ✅ SafeAreaView за правилно позициониране - **НЕ Е ПРИЛОЖИМО ЗА WEB**
- ✅ Bottom Tab Navigation - **НЕ Е ПРИЛОЖИМО ЗА WEB**
- ✅ Native Call Screens - **НЕ Е ПРИЛОЖИМО ЗА WEB**

#### 2. **AUTHENTICATION**
- ✅ OAuth Login (Google, Facebook) - ✅ ИМА И В WEB ВЕРСИЯТА

---

## 🎯 ПЛАН ЗА ДОПЪЛВАНЕ НА МОБИЛНАТА ВЕРСИЯ

### 📋 ПРИОРИТЕТ 1: КРИТИЧНИ ФУНКЦИОНАЛНОСТИ

#### 1. **Emoji Picker** 🔴 ВИСОК ПРИОРИТЕТ
- **Описание**: Добавяне на emoji picker в MessageInput
- **Компонент**: `EmojiPicker.tsx`
- **Библиотека**: `react-native-emoji-picker` или `emoji-mart-native`
- **Функционалност**:
  - Emoji категории (smileys, gestures, people, animals, food, travel, activities, objects, symbols, flags)
  - Search в emoji
  - Recent emoji
  - Emoji preview при hover
- **Интеграция**: Бутон в MessageInput, който отваря emoji picker

#### 2. **Edit Message** 🔴 ВИСОК ПРИОРИТЕТ
- **Описание**: Възможност за редактиране на изпратени съобщения
- **API**: `PUT /messages/{messageId}/edit`
- **UI**: Long press на съобщение → меню с опция "Редактирай"
- **Функционалност**:
  - Показване на "Редактирано" badge
  - Визуална индикация за редактирани съобщения
  - История на редактиранията (опционално)

#### 3. **Delete Message** 🔴 ВИСОК ПРИОРИТЕТ
- **Описание**: Възможност за изтриване на съобщения
- **API**: `DELETE /messages/{messageId}`
- **UI**: Long press на съобщение → меню с опция "Изтрий"
- **Функционалност**:
  - Confirmation dialog
  - Soft delete (показва "Съобщението е изтрито")
  - Hard delete (опционално)

#### 4. **Delete/Hide Conversation** 🔴 ВИСОК ПРИОРИТЕТ
- **Описание**: Възможност за изтриване или скриване на разговори
- **API**: `DELETE /conversations/{conversationId}` и `PUT /conversations/{conversationId}/hide`
- **UI**: Swipe to delete или long press в ConversationItem
- **Функционалност**:
  - Swipe left за delete/hide
  - Confirmation dialog
  - Undo функционалност (опционално)

#### 5. **Message Search в Chat** 🟡 СРЕДЕН ПРИОРИТЕТ
- **Описание**: Търсене на съобщения в конкретен разговор
- **UI**: Search bar в ChatHeader
- **Функционалност**:
  - Търсене по текст
  - Търсене по дата
  - Търсене по файлове (когато се добави file attachments)
  - Highlight на намерените съобщения
  - Navigation между резултатите

#### 6. **Audio Device Selector** 🟡 СРЕДЕН ПРИОРИТЕТ
- **Описание**: Избор на микрофон, speaker и camera за calls
- **Компонент**: `AudioDeviceSelector.tsx`
- **Функционалност**:
  - Списък с налични микрофони
  - Списък с налични speakers
  - Списък с налични cameras (за video calls)
  - Volume controls
  - Audio visualization (waveform)
  - Test functionality
- **Интеграция**: Settings screen или Call screen

#### 7. **Message Sounds** 🟡 СРЕДЕН ПРИОРИТЕТ
- **Описание**: Звуци при получаване на нови съобщения
- **Библиотека**: `react-native-sound` или `expo-av`
- **Функционалност**:
  - Custom sound за нови съобщения
  - Custom sound за calls
  - Volume control
  - Mute option
  - Sound preview
- **Settings**: Notification settings screen

---

### 📋 ПРИОРИТЕТ 2: ДОПЪЛНИТЕЛНИ ФУНКЦИОНАЛНОСТИ

#### 8. **File Attachments** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Изпращане на файлове, снимки и видеоклипове
- **Библиотека**: `react-native-image-picker`, `react-native-document-picker`
- **Функционалност**:
  - Избор на снимки от галерия
  - Снимане на снимки с camera
  - Избор на файлове
  - Image preview преди изпращане
  - Image compression
  - File size validation
  - Progress indicator при upload
- **API**: Нова endpoint за file upload
- **UI**: Attach бутон в MessageInput

#### 9. **Video Calls** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Video calls освен voice calls
- **Функционалност**:
  - Video preview
  - Camera switch (front/back)
  - Video quality settings
  - Picture-in-picture mode
- **Интеграция**: LiveKit вече поддържа video

#### 10. **Conversation Search** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Търсене в списъка с разговори
- **UI**: Search bar в ConversationsListScreen
- **Функционалност**:
  - Търсене по име на потребител
  - Търсене по последно съобщение
  - Filter по непрочетени
  - Sort options (по дата, по име)

#### 11. **Following Users Panel** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Панел със следвани потребители в UserSearchScreen
- **API**: `GET /users/following`
- **UI**: Разделение в UserSearchScreen - Search Results и Following Users
- **Функционалност**:
  - Списък със следвани потребители
  - Quick start conversation
  - Online status indicators

#### 12. **Infinite Scroll** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Зареждане на стари съобщения при scroll нагоре
- **Библиотека**: `react-native-infinite-scroll` или custom implementation
- **Функционалност**:
  - Auto-load при scroll нагоре
  - Loading indicator
  - Pagination (page, size)
  - Scroll position preservation

#### 13. **Message Thread View** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Thread view за reply на съобщения
- **Функционалност**:
  - Reply на конкретно съобщение
  - Thread view
  - Thread navigation
- **UI**: Long press на съобщение → "Reply"

---

### 📋 ПРИОРИТЕТ 3: НАСТРОЙКИ И ПЕРСОНАЛИЗАЦИЯ

#### 14. **Settings Screen** 🟡 СРЕДЕН ПРИОРИТЕТ
- **Описание**: Пълен Settings screen с всички настройки
- **Компонент**: `SettingsScreen.tsx`
- **Секции**:
  - **Notifications**:
    - Push notifications on/off
    - Message sounds on/off
    - Call sounds on/off
    - Notification preview
    - Do Not Disturb mode
  - **Privacy**:
    - Online status visibility
    - Read receipts on/off
    - Last seen visibility
    - Block users
  - **Audio/Video**:
    - Default microphone
    - Default speaker
    - Default camera
    - Audio quality
    - Video quality
  - **Chat**:
    - Message font size
    - Theme (light/dark)
    - Language
  - **Storage**:
    - Clear cache
    - Clear conversations
    - Storage usage
  - **About**:
    - App version
    - Terms of Service
    - Privacy Policy
    - Contact support

#### 15. **Dark Mode** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Dark mode тема
- **Функционалност**:
  - System theme detection
  - Manual theme switch
  - Theme persistence
- **Интеграция**: Settings screen

#### 16. **Profile Edit** 🟡 СРЕДЕН ПРИОРИТЕТ
- **Описание**: Редактиране на профил
- **Функционалност**:
  - Edit name
  - Edit username
  - Change avatar
  - Change bio (ако се добави)
- **UI**: EditProfileScreen

---

### 📋 ПРИОРИТЕТ 4: ДОПЪЛНИТЕЛНИ ПОЛЕЗНИ ФУНКЦИОНАЛНОСТИ

#### 17. **Message Reactions** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: React на съобщения с emoji
- **Функционалност**:
  - Long press на съобщение → emoji reactions
  - Показване на reactions под съобщението
  - Multiple reactions от различни потребители
- **API**: Нова endpoint за reactions

#### 18. **Message Forwarding** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Препращане на съобщения към други разговори
- **Функционалност**:
  - Long press на съобщение → "Препрати"
  - Избор на разговор
  - Multiple message forwarding
- **UI**: ForwardModal

#### 19. **Voice Messages** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Записване и изпращане на voice messages
- **Библиотека**: `react-native-audio-recorder-player`
- **Функционалност**:
  - Record voice message
  - Play voice message
  - Waveform visualization
  - Duration display
- **UI**: Voice message button в MessageInput (hold to record)

#### 20. **Message Pinning** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Закачане на важни съобщения
- **Функционалност**:
  - Pin message
  - Pinned messages section в chat
  - Unpin message
- **UI**: Pin icon в chat header

#### 21. **Group Chats** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Групови разговори
- **Функционалност**:
  - Create group
  - Add/remove members
  - Group settings
  - Group avatar
  - Group name
- **API**: Нови endpoints за groups

#### 22. **Message Status Details** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Детайли за статуса на съобщението (sent, delivered, read)
- **Функционалност**:
  - Tap на status icon → показва детайли
  - Timestamp за sent, delivered, read
  - Who read the message (за group chats)

#### 23. **Chat Backup & Restore** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Backup и restore на разговори
- **Функционалност**:
  - Export conversations
  - Import conversations
  - Cloud backup (опционално)
- **UI**: Settings screen

#### 24. **Message Translation** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Превод на съобщения
- **API**: Google Translate API или друг translation service
- **Функционалност**:
  - Long press на съобщение → "Преведи"
  - Auto-detect language
  - Show original/translated toggle

#### 25. **Rich Text Formatting** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Bold, italic, underline, code formatting
- **Функционалност**:
  - Markdown support
  - Formatting toolbar
  - Preview mode
- **UI**: Formatting buttons в MessageInput

#### 26. **Location Sharing** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Споделяне на локация
- **Библиотека**: `react-native-geolocation`, `react-native-maps`
- **Функционалност**:
  - Share current location
  - Share location on map
  - Live location sharing (опционално)
- **UI**: Location button в MessageInput

#### 27. **Contact Sharing** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Споделяне на контакти
- **Библиотека**: `react-native-contacts`
- **Функционалност**:
  - Share contact card
  - Import contacts
  - Sync contacts (опционално)

#### 28. **Message Scheduling** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Планиране на съобщения за изпращане в бъдеще
- **Функционалност**:
  - Schedule message
  - Scheduled messages list
  - Edit/delete scheduled messages
- **UI**: Schedule button в MessageInput

#### 29. **Chat Themes** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Персонализирани теми за всеки разговор
- **Функционалност**:
  - Custom background
  - Custom colors
  - Theme gallery
- **UI**: Chat settings → Theme

#### 30. **Message Search (Global)** 🟢 НИСЪК ПРИОРИТЕТ
- **Описание**: Глобално търсене във всички разговори
- **Функционалност**:
  - Search в цялата база данни
  - Filter по разговор, дата, тип
  - Search history
- **UI**: Global search screen

---

## 📊 СТАТИСТИКА

### Липсващи функционалности в мобилната версия:
- **Критични**: 7 функционалности
- **Средни**: 4 функционалности
- **Ниски**: 19 функционалности
- **Общо**: 30 функционалности

### Приоритети:
- 🔴 **Висок**: 5 функционалности (Emoji Picker, Edit Message, Delete Message, Delete/Hide Conversation, Message Search)
- 🟡 **Среден**: 6 функционалности (Audio Device Selector, Message Sounds, Settings Screen, Profile Edit, Conversation Search, Following Users Panel)
- 🟢 **Нисък**: 19 функционалности (всички допълнителни)

---

## 🚀 ПРЕПОРЪЧАН РЕД ЗА ИМПЛЕМЕНТАЦИЯ

### Фаза 1: Основни функционалности (2-3 седмици)
1. Emoji Picker
2. Edit Message
3. Delete Message
4. Delete/Hide Conversation
5. Message Search в Chat

### Фаза 2: Настройки и подобрения (2 седмици)
6. Settings Screen
7. Audio Device Selector
8. Message Sounds
9. Profile Edit

### Фаза 3: Допълнителни функционалности (3-4 седмици)
10. File Attachments
11. Video Calls
12. Conversation Search
13. Following Users Panel
14. Infinite Scroll

### Фаза 4: Разширени функционалности (4+ седмици)
15. Message Reactions
16. Voice Messages
17. Message Forwarding
18. Group Chats
19. Dark Mode
20. И други...

---

## 📝 ЗАБЕЛЕЖКИ

- Някои функционалности от web версията не са приложими за мобилна (multiple windows, drag & drop, taskbar)
- Мобилната версия има някои предимства (push notifications, offline support, native feel)
- Приоритетите могат да се променят според feedback от потребителите
- Всички функционалности трябва да се тестват добре преди release

