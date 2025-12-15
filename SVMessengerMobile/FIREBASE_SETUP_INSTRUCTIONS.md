# 🔥 Firebase Setup - Подробни Инструкции

## 📋 Какво трябва ТИ да направиш (което аз не мога)

Това е стъпка по стъпка ръководство за Firebase setup. Следвай точно тези стъпки.

---

## 🎯 Стъпка 1: Създаване на Firebase Проект

### 1.1 Отиди на Firebase Console
1. Отвори браузър и отиди на: https://console.firebase.google.com/
2. Влез с твоя Google акаунт (ако нямаш, създай си)

### 1.2 Създай нов проект
1. Кликни на **"Add project"** или **"Create a project"**
2. Въведи име на проекта: `SVMessenger` (или каквото предпочиташ)
3. Кликни **"Continue"**
4. Избери дали да включиш Google Analytics (препоръчително е да го включиш)
5. Кликни **"Create project"**
6. Изчакай да се създаде проекта (няколко секунди)
7. Кликни **"Continue"**

**✅ Запиши Project ID:** Ще го видиш в Project Settings. Ще изглежда нещо като `svmessenger-xxxxx`

---

## 🤖 Стъпка 2: Android App Setup

### 2.1 Добави Android приложение в Firebase
1. В Firebase Console, на главната страница на проекта, кликни на иконката **Android** (или "Add app" > Android)
2. Попълни формата:
   - **Android package name:** `com.svmessengermobile`
     - ⚠️ **ВАЖНО:** Това трябва да съвпада точно с `applicationId` в `android/app/build.gradle`
     - Провери в `android/app/build.gradle` на ред 82: `applicationId "com.svmessengermobile"`
   - **App nickname (optional):** `SVMessenger Android`
   - **Debug signing certificate SHA-1 (optional):** Остави празно за сега
3. Кликни **"Register app"**

### 2.2 Изтегли google-services.json
1. След регистрацията, Firebase ще покаже екран с инструкции
2. Кликни на бутона **"Download google-services.json"**
3. **ВАЖНО:** Запази файла на удобно място (Desktop или Downloads)

### 2.3 Постави google-services.json в проекта
1. Отвори файла `SVMessengerMobile/android/app/google-services.json` (ако не съществува, създай го)
2. Копирай **цялото съдържание** от изтегления `google-services.json` файл
3. Постави го в `SVMessengerMobile/android/app/google-services.json`
4. **Провери че файлът е точно на това място:**
   ```
   SVMessengerMobile/
   └── android/
       └── app/
           └── google-services.json  ← ТУК!
   ```

### 2.4 Проверка
- Файлът `google-services.json` трябва да съдържа JSON с ключове като `project_id`, `client`, `api_key`, и др.

---

## 🍎 Стъпка 3: iOS App Setup

### 3.1 Добави iOS приложение в Firebase
1. В Firebase Console, на главната страница на проекта, кликни на иконката **iOS** (или "Add app" > iOS)
2. Попълни формата:
   - **iOS bundle ID:** `com.svmessengermobile`
     - ⚠️ **ВАЖНО:** Това трябва да съвпада точно с Bundle Identifier в Xcode
     - За да провериш: Отвори `ios/SVMessengerMobile.xcodeproj` в Xcode и провери Bundle Identifier
   - **App nickname (optional):** `SVMessenger iOS`
   - **App Store ID (optional):** Остави празно
3. Кликни **"Register app"**

### 3.2 Изтегли GoogleService-Info.plist
1. След регистрацията, Firebase ще покаже екран с инструкции
2. Кликни на бутона **"Download GoogleService-Info.plist"**
3. **ВАЖНО:** Запази файла на удобно място

### 3.3 Постави GoogleService-Info.plist в проекта
1. Отвори файла `SVMessengerMobile/ios/SVMessengerMobile/GoogleService-Info.plist` (ако не съществува, създай го)
2. Копирай **цялото съдържание** от изтегления `GoogleService-Info.plist` файл
3. Постави го в `SVMessengerMobile/ios/SVMessengerMobile/GoogleService-Info.plist`
4. **Провери че файлът е точно на това място:**
   ```
   SVMessengerMobile/
   └── ios/
       └── SVMessengerMobile/
           └── GoogleService-Info.plist  ← ТУК!
   ```

### 3.4 Добави файла в Xcode (ВАЖНО!)
1. Отвори `SVMessengerMobile/ios/SVMessengerMobile.xcodeproj` в Xcode
2. В лявото меню (Project Navigator), намери папката `SVMessengerMobile`
3. Кликни десен бутон върху папката `SVMessengerMobile` > **"Add Files to SVMessengerMobile..."**
4. Избери файла `GoogleService-Info.plist` (който току-що постави)
5. **ВАЖНО:** Провери че е избрано:
   - ✅ "Copy items if needed" (ако файлът не е в проекта)
   - ✅ "Add to targets: SVMessengerMobile"
6. Кликни **"Add"**
7. Провери че файлът се появява в Project Navigator

### 3.5 Проверка
- Файлът `GoogleService-Info.plist` трябва да съдържа ключове като `PROJECT_ID`, `BUNDLE_ID`, `API_KEY`, и др.

---

## 🔔 Стъпка 4: Push Notifications Setup

### 4.1 Android - FCM е готов по подразбиране
- Android автоматично използва FCM (Firebase Cloud Messaging)
- Няма нужда от допълнителна конфигурация

### 4.2 iOS - APNs Certificate Setup (ВАЖНО!)

iOS изисква Apple Push Notification service (APNs) certificate. Това е най-сложната част.

#### Вариант A: APNs Authentication Key (Препоръчително - по-лесно)

1. **В Apple Developer Portal:**
   - Отиди на https://developer.apple.com/account/
   - Влез с твоя Apple Developer акаунт
   - Отиди на **"Certificates, Identifiers & Profiles"**
   - В лявото меню, кликни на **"Keys"**
   - Кликни на **"+"** за нов ключ
   - Име: `SVMessenger APNs Key`
   - Избери **"Apple Push Notifications service (APNs)"**
   - Кликни **"Continue"** > **"Register"**
   - **ВАЖНО:** Изтегли `.p8` файла веднага (можеш да го изтеглиш само веднъж!)
   - Запиши **Key ID** (ще го видиш в списъка с ключове)

2. **В Firebase Console:**
   - Отиди на проекта в Firebase Console
   - Отиди на **Project Settings** (⚙️ иконка) > **Cloud Messaging** tab
   - В секцията **"Apple app configuration"**, кликни **"Upload"** под "APNs Authentication Key"
   - Качи `.p8` файла
   - Въведи **Key ID**
   - Въведи **Team ID** (от Apple Developer Portal > Membership)
   - Кликни **"Upload"**

#### Вариант B: APNs Certificate (По-сложно)

Ако предпочиташ certificate вместо key:

1. **В Apple Developer Portal:**
   - Отиди на **"Certificates"**
   - Кликни **"+"** за нов certificate
   - Избери **"Apple Push Notification service SSL (Sandbox & Production)"**
   - Избери твоя App ID (`com.svmessengermobile`)
   - Следвай инструкциите за създаване на Certificate Signing Request (CSR)
   - Изтегли certificate файла

2. **В Firebase Console:**
   - Отиди на **Project Settings** > **Cloud Messaging**
   - Качи certificate файла

---

## ✅ Стъпка 5: Проверка на Конфигурацията

### 5.1 Проверка на файловете

Провери че следните файлове съществуват:

```
SVMessengerMobile/
├── android/
│   └── app/
│       └── google-services.json  ✅ Трябва да съществува
└── ios/
    └── SVMessengerMobile/
        └── GoogleService-Info.plist  ✅ Трябва да съществува
```

### 5.2 Проверка на съдържанието

**google-services.json** трябва да съдържа:
```json
{
  "project_info": {
    "project_number": "...",
    "project_id": "svmessenger-xxxxx",
    ...
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "...",
        "android_client_info": {
          "package_name": "com.svmessengermobile"
        }
      },
      ...
    }
  ],
  ...
}
```

**GoogleService-Info.plist** трябва да съдържа:
```xml
<dict>
  <key>PROJECT_ID</key>
  <string>svmessenger-xxxxx</string>
  <key>BUNDLE_ID</key>
  <string>com.svmessengermobile</string>
  ...
</dict>
```

---

## 🚀 Стъпка 6: Инсталиране на Dependencies

След като добавиш конфигурационните файлове, инсталирай dependencies:

### Android:
```bash
cd SVMessengerMobile
npm install
```

### iOS:
```bash
cd SVMessengerMobile/ios
pod install
cd ..
```

---

## 🔒 Стъпка 7: Security - .gitignore

**ВАЖНО:** Тези файлове съдържат чувствителна информация и НЕ трябва да се комитват в git!

Провери че `SVMessengerMobile/.gitignore` съдържа:
```
# Firebase
**/google-services.json
**/GoogleService-Info.plist
```

Ако не са там, добави ги!

---

## 📝 Резюме - Какво трябва ТИ да направиш:

1. ✅ Създай Firebase проект
2. ✅ Добави Android app и изтегли `google-services.json`
3. ✅ Постави `google-services.json` в `android/app/`
4. ✅ Добави iOS app и изтегли `GoogleService-Info.plist`
5. ✅ Постави `GoogleService-Info.plist` в `ios/SVMessengerMobile/`
6. ✅ Добави `GoogleService-Info.plist` в Xcode проект
7. ✅ Настрой APNs в Firebase Console (за iOS)
8. ✅ Провери че файловете са на правилните места
9. ✅ Инсталирай dependencies (`npm install` и `pod install`)

---

## ❓ Често срещани проблеми

### Проблем: "google-services.json not found"
**Решение:** Провери че файлът е точно в `android/app/google-services.json`

### Проблем: "GoogleService-Info.plist not found" (iOS)
**Решение:** 
1. Провери че файлът е в `ios/SVMessengerMobile/GoogleService-Info.plist`
2. Провери че е добавен в Xcode проект

### Проблем: "Package name mismatch"
**Решение:** Провери че package name в Firebase съвпада с `applicationId` в `build.gradle`

### Проблем: "Bundle ID mismatch" (iOS)
**Решение:** Провери че Bundle ID в Firebase съвпада с Bundle Identifier в Xcode

---

## ✅ След като направиш всичко това:

Кажи ми кога си готов и аз ще:
1. Актуализирам AndroidManifest.xml с notification permissions
2. Актуализирам iOS Info.plist с notification permissions
3. Тествам дали всичко работи правилно

---

**Последна актуализация:** 2025-01-15

