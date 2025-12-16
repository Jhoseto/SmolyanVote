# 🔥 Firebase Setup за Backend - Push Notifications

## ⚠️ ВАЖНО: Разлика между Firebase за Mobile и Backend

### Firebase за Mobile App:
- **google-services.json** (Android) / **GoogleService-Info.plist** (iOS)
- Използва се от мобилното приложение
- За получаване на FCM tokens и получаване на notifications

### Firebase за Backend:
- **firebase-service-account.json** (Service Account Key)
- Използва се от backend-а
- За изпращане на push notifications до устройствата

**Те са РАЗЛИЧНИ файлове!**

---

## 📋 Стъпки за създаване на Service Account Key:

### Стъпка 1: Отиди на Firebase Console
1. Отиди на [Firebase Console](https://console.firebase.google.com/)
2. Избери проекта: **svmessenger-mobile** (виждам от google-services.json)

### Стъпка 2: Създай Service Account
1. Project Settings (⚙️) > **Service Accounts**
2. Натисни **"Generate new private key"**
3. Натисни **"Generate key"**
4. JSON файлът ще се свали автоматично

### Стъпка 3: Постави файла
**Вариант 1: В root директорията на проекта**
```
D:\MyProjectsJAVA\SmolyanVote\smolyanVote\firebase-service-account.json
```

**Вариант 2: В SVMessengerMobile директорията**
```
D:\MyProjectsJAVA\SmolyanVote\smolyanVote\SVMessengerMobile\firebase-service-account.json
```

**Вариант 3: В src/main/resources (за production)**
```
D:\MyProjectsJAVA\SmolyanVote\smolyanVote\src\main\resources\firebase-service-account.json
```

**Вариант 4: Environment variable**
```bash
# Задай пътя в environment variable
export FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/firebase-service-account.json
```

---

## ✅ Проверка:

След като поставиш файла и рестартираш приложението, в логовете трябва да видиш:
```
✅ Loading Firebase service account from: [път към файла]
✅ Firebase initialized successfully
```

---

## 🔒 Безопасност:

**ВАЖНО:** Service account key файлът НЕ трябва да се комитва в git!

Провери `.gitignore`:
```
firebase-service-account.json
**/firebase-service-account.json
```

---

## 🎯 Резултат:

След като добавиш service account key:
- ✅ Push notifications ще се изпращат реално
- ✅ Няма повече warning "Firebase is not enabled"
- ✅ Логовете ще показват: `✅ FCM notification sent successfully`

---

## 📝 Забележка:

Ако не искаш да използваш push notifications от backend-а, можеш да оставиш `firebase.enabled=false` в `application.properties`. В този случай notifications няма да се изпращат, но мобилното приложение все още може да получава notifications директно от Firebase.

