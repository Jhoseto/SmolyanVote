# 📱 SVMessenger Mobile - План за Имплементация

## ✅ ФУНКЦИОНАЛНОСТИ ЗА ИМПЛЕМЕНТАЦИЯ

### 🔴 ФАЗА 1: КРИТИЧНИ ФУНКЦИОНАЛНОСТИ (2-3 седмици)

1. **Emoji Picker** ✅
   - Компонент: `EmojiPicker.tsx`
   - Библиотека: `react-native-emoji-picker` или `emoji-mart-native`
   - Интеграция: Бутон в MessageInput

2. **Edit Message** ✅
   - API: `PUT /messages/{messageId}/edit`
   - UI: Long press на съобщение → меню → "Редактирай"
   - Визуална индикация: "Редактирано" badge

3. **Delete Message** ✅
   - API: `DELETE /messages/{messageId}`
   - UI: Long press на съобщение → меню → "Изтрий"
   - Confirmation dialog

4. **Delete/Hide Conversation** ✅
   - API: `DELETE /conversations/{conversationId}` и `PUT /conversations/{conversationId}/hide`
   - UI: Swipe to delete или long press в ConversationItem
   - Confirmation dialog

5. **Message Search в Chat** ✅
   - UI: Search bar в ChatHeader
   - Търсене по текст
   - Highlight на намерените съобщения
   - Navigation между резултатите

---

### 🟡 ФАЗА 2: НАСТРОЙКИ И ПОДОБРЕНИЯ (2 седмици)

6. **Settings Screen** ✅
   - Компонент: `SettingsScreen.tsx`
   - Секции:
     - Notifications (push, sounds, DND)
     - Privacy (online status, read receipts, last seen)
     - Chat (font size, theme, language)
     - Storage (clear cache, clear conversations)
     - About (version, terms, privacy, support)
   - БЕЗ Audio Device Selector (автоматично за телефона)

7. **Message Sounds** ✅
   - Библиотека: `react-native-sound` или `expo-av`
   - Custom sound за нови съобщения
   - Custom sound за calls
   - Volume control
   - Mute option
   - Settings integration

8. **Profile Edit** ✅ (ОГРАНИЧЕНО)
   - Компонент: `EditProfileScreen.tsx`
   - Функционалност:
     - Change avatar (снимка)
     - Edit bio
   - БЕЗ: Edit name, Edit username

---

### 🟢 ФАЗА 3: ДОПЪЛНИТЕЛНИ ФУНКЦИОНАЛНОСТИ (3-4 седмици)

9. **Video Calls** ✅
   - Интеграция с LiveKit (вече имаме LiveKit service)
   - Video preview
   - Camera switch (front/back)
   - Video quality settings
   - Picture-in-picture mode (опционално)
   - Работи като web версията

10. **Conversation Search** ✅
    - UI: Search bar в ConversationsListScreen
    - Търсене по име на потребител
    - Търсене по последно съобщение
    - Filter по непрочетени
    - Sort options

11. **Following Users Panel** ✅
    - API: `GET /users/following`
    - UI: Разделение в UserSearchScreen
    - Списък със следвани потребители
    - Quick start conversation

12. **Infinite Scroll** ✅
    - Auto-load при scroll нагоре
    - Loading indicator
    - Pagination (page, size)
    - Scroll position preservation

13. **Message Thread View** ✅
    - Reply на конкретно съобщение
    - Thread view
    - Thread navigation
    - UI: Long press на съобщение → "Reply"

---

### 🔵 ФАЗА 4: РАЗШИРЕНИ ФУНКЦИОНАЛНОСТИ (4+ седмици)

14. **Message Reactions** ✅
    - Long press на съобщение → emoji reactions
    - Показване на reactions под съобщението
    - Multiple reactions от различни потребители
    - API: Нова endpoint за reactions

15. **Message Forwarding** ✅
    - Long press на съобщение → "Препрати"
    - Избор на разговор
    - Multiple message forwarding
    - UI: ForwardModal

16. **Message Status Details** ✅
    - Tap на status icon → детайли
    - Timestamp за sent, delivered, read
    - Who read the message (за бъдещи group chats)

17. **Message Translation** ✅
    - Long press на съобщение → "Преведи"
    - Auto-detect language
    - Show original/translated toggle
    - API: Google Translate API или друг

18. **Contact Sharing** ✅
    - Библиотека: `react-native-contacts`
    - Share contact card
    - Import contacts
    - UI: Contact button в MessageInput

19. **Message Search (Global)** ✅
    - Глобално търсене във всички разговори
    - Filter по разговор, дата, тип
    - Search history
    - UI: Global search screen

20. **Dark Mode** ✅
    - System theme detection
    - Manual theme switch
    - Theme persistence
    - Settings integration

---

## ❌ ФУНКЦИОНАЛНОСТИ КОИТО НЕ СЕ ИМПЛЕМЕНТИРАТ

- ❌ Audio Device Selector (автоматично за телефона)
- ❌ File Attachments (само placeholder за сега)
- ❌ Voice Messages
- ❌ Message Pinning
- ❌ Group Chats
- ❌ Chat Backup & Restore
- ❌ Rich Text Formatting
- ❌ Location Sharing
- ❌ Message Scheduling
- ❌ Chat Themes

---

## 🎯 РЕД ЗА ИМПЛЕМЕНТАЦИЯ

### Седмица 1-2: Фаза 1 (Критични)
1. Emoji Picker
2. Edit Message
3. Delete Message
4. Delete/Hide Conversation
5. Message Search в Chat

### Седмица 3-4: Фаза 2 (Настройки)
6. Settings Screen
7. Message Sounds
8. Profile Edit (ограничено)

### Седмица 5-8: Фаза 3 (Допълнителни)
9. Video Calls
10. Conversation Search
11. Following Users Panel
12. Infinite Scroll
13. Message Thread View

### Седмица 9+: Фаза 4 (Разширени)
14. Message Reactions
15. Message Forwarding
16. Message Status Details
17. Message Translation
18. Contact Sharing
19. Message Search (Global)
20. Dark Mode

---

## 📝 ЗАБЕЛЕЖКИ

- Всички функционалности трябва да работят с вече съществуващия backend
- Video calls трябва да използват LiveKit (вече интегриран)
- Settings screen трябва да е пълен и функционален
- Profile Edit е ограничен само до снимки и bio
- File Attachments е само placeholder (бутон, но не работи)

