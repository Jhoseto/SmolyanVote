# 🔧 Как да Активирате "Generate Signed Bundle / APK" в Android Studio

## Проблем
Бутонът "Generate Signed Bundle / APK" не е активен в Android Studio.

## Решения

### ✅ Решение 1: Gradle Sync

1. **Отворете Android Studio**
2. **File > Sync Project with Gradle Files** (или натиснете `Ctrl+Shift+O`)
3. Изчакайте да завърши синхронизацията
4. Проверете дали има грешки в **Build** панела

### ✅ Решение 2: Clean и Rebuild

1. **Build > Clean Project**
2. Изчакайте да завърши
3. **Build > Rebuild Project**
4. Изчакайте да завърши
5. Опитайте отново **Build > Generate Signed Bundle / APK**

### ✅ Решение 3: Проверка на Build Variants

1. **View > Tool Windows > Build Variants** (или долният ляв ъгъл)
2. Уверете се че има **release** variant за **app** модула
3. Ако няма, проверете `build.gradle` файла

### ✅ Решение 4: Отваряне на Правилния Проект

Уверете се че отваряте **android** папката, не root папката:

1. **File > Open**
2. Изберете: `SVMessengerMobile/android` (не `SVMessengerMobile`)
3. Изчакайте Gradle sync да завърши

### ✅ Решение 5: Проверка на Gradle Console

1. **View > Tool Windows > Build**
2. Проверете за грешки
3. Ако има грешки, опитайте:
   ```powershell
   cd SVMessengerMobile/android
   .\gradlew.bat clean
   ```

### ✅ Решение 6: Инвалидиране на Cache

1. **File > Invalidate Caches / Restart**
2. Изберете **Invalidate and Restart**
3. Изчакайте Android Studio да рестартира
4. Опитайте отново

---

## 🎯 Алтернативен Метод: Gradle Command Line

Ако Android Studio все още не работи, можете да генерирате APK директно:

### Стъпка 1: Bundle на JavaScript

```powershell
cd SVMessengerMobile
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
```

### Стъпка 2: Генериране на APK

```powershell
cd android
.\gradlew.bat assembleRelease
```

### Стъпка 3: Намиране на APK

APK файлът ще бъде в:
```
SVMessengerMobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## ✅ Проверка на Конфигурацията

След като направих промените в `build.gradle`, трябва да:

1. **Sync Project with Gradle Files** (`Ctrl+Shift+O`)
2. Проверете че няма грешки
3. **Build > Generate Signed Bundle / APK** трябва да е активен

---

## 📝 Забележки

- Уверете се че `debug.keystore` файлът съществува в `android/app/` папката
- Ако няма, Android Studio ще го създаде автоматично при първи build
- За production трябва да генерирате собствен keystore файл

