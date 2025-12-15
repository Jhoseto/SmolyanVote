# Firebase Setup Guide за SVMessenger Mobile

## Стъпки за Firebase Setup

### 1. Създаване на Firebase проект

1. Отиди на [Firebase Console](https://console.firebase.google.com/)
2. Създай нов проект или използвай съществуващ
3. Запиши Project ID

### 2. Android Setup

1. В Firebase Console, отиди на Project Settings > General
2. Добави Android app:
   - Package name: `com.svmessengermobile` (или каквото е в `android/app/build.gradle`)
   - Download `google-services.json`
   - Постави го в `android/app/google-services.json`

3. В `android/build.gradle` (project level), добави:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.2'
    }
}
```

4. В `android/app/build.gradle`, добави в края:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 3. iOS Setup

1. В Firebase Console, добави iOS app:
   - Bundle ID: `com.svmessengermobile` (или каквото е в `ios/SVMessengerMobile/Info.plist`)
   - Download `GoogleService-Info.plist`
   - Постави го в `ios/SVMessengerMobile/GoogleService-Info.plist`

2. В Xcode, добави `GoogleService-Info.plist` към проекта

### 4. Инсталиране на зависимости

```bash
cd SVMessengerMobile
npm install
cd ios && pod install && cd ..
```

### 5. Конфигурация

След като добавиш конфигурационните файлове, приложението автоматично ще работи с Firebase.

## Важни бележки

- `google-services.json` и `GoogleService-Info.plist` НЕ трябва да се комитват в git (добави ги в .gitignore)
- Тези файлове съдържат чувствителна информация
- За production, използвай отделни Firebase проекти за dev и prod

