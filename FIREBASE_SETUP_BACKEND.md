# 🔥 Firebase Setup за Backend - Push Notifications

## ✅ Какво е направено:

1. **Firebase Admin SDK dependency** - Добавена в `build.gradle.kts`
2. **FirebaseConfig клас** - Създаден за инициализация на Firebase
3. **PushNotificationService** - Имплементирана реална функционалност с Firebase Admin SDK
4. **Application.properties** - Добавена конфигурация `firebase.enabled=true`

## 📋 Стъпки за пълна активация:

### Стъпка 1: Създаване на Firebase Service Account

1. Отиди на [Firebase Console](https://console.firebase.google.com/)
2. Избери проекта (или създай нов)
3. Project Settings > Service Accounts
4. Натисни "Generate new private key"
5. Свали JSON файла

### Стъпка 2: Конфигуриране на Service Account Key

**Вариант 1: Файл път (Препоръчително за development)**
```properties
# В application.properties или environment variable
firebase.service-account-key=/path/to/firebase-service-account.json
```

**Вариант 2: Classpath (За production)**
1. Постави `firebase-service-account.json` в `src/main/resources/`
2. Firebase автоматично ще го намери

**Вариант 3: Environment Variable (За production)**
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/firebase-service-account.json
```

### Стъпка 3: Рестартиране на приложението

След като добавиш service account key, рестартирай приложението.

## ✅ Проверка:

След рестартиране, в логовете трябва да видиш:
```
✅ Firebase initialized successfully
```

Ако видиш грешка, провери:
- Service account key файлът е на правилния път
- Service account key има правилни permissions (Firebase Cloud Messaging Admin)
- Firebase проектът е правилно конфигуриран

## 🎯 Резултат:

След активация:
- ✅ Push notifications ще се изпращат реално до устройствата
- ✅ Няма повече warning "Firebase is not enabled"
- ✅ Логовете ще показват успешни изпращания: `✅ FCM notification sent successfully`

## ⚠️ Забележки:

- Service account key файлът НЕ трябва да се комитва в git
- Добави го в `.gitignore`
- За production, използвай отделен Firebase проект
- Service account key трябва да има "Firebase Cloud Messaging Admin" role

