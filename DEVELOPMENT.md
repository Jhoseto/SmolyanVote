# 🚀 SmolyanVote - Development Guide

## 📋 Environment Profiles

Проектът използва **Spring Profiles** за различни среди:

### 🔧 Development (dev)
- **Cache**: Изключен
- **DevTools**: Включен (auto-reload)
- **LiveReload**: Включен
- **Secure Cookies**: Изключени
- **Error Details**: Показани
- **Logging**: DEBUG level

### 🏭 Production (prod)
- **Cache**: Включен (1 година)
- **DevTools**: Изключен
- **LiveReload**: Изключен
- **Secure Cookies**: Включени
- **Error Details**: Скрити (security)
- **Logging**: INFO/WARN level
- **Compression**: Включена

---

## 🎯 Как да стартирам?

### Development (Локално)

```bash
# Вариант 1: Използвай Gradle task
.\gradlew.bat bootRunDev

# Вариант 2: Default е dev
.\gradlew.bat bootRun

# Вариант 3: Set environment variable
$env:SPRING_PROFILES_ACTIVE="dev"
.\gradlew.bat bootRun
```

### Production (Production server)

```bash
# Вариант 1: Използвай Gradle task
.\gradlew.bat bootRunProd

# Вариант 2: Set environment variable
export SPRING_PROFILES_ACTIVE=prod
.\gradlew.bat bootRun

# Вариант 3: Като JAR
java -jar -Dspring.profiles.active=prod build/libs/SmolyanVote-1.jar
```

---

## 🔄 Development Workflow

### За CSS/JS/HTML промени:

1. **Направи промяна** в `src/main/resources/static/`
2. **Запази файла** (`Ctrl + S`)
3. **Hard Refresh в браузъра** (`Ctrl + Shift + R`)
4. ✅ Виждаш промените веднага!

**Забележка:** С DevTools, статичните ресурси се презареждат автоматично!

### За Java промени:

1. **Направи промяна** в `.java` файл
2. **Запази файла** (`Ctrl + S`)
3. ⏳ DevTools ще рестартира приложението автоматично (5-10 сек)
4. ✅ Виждаш промените!

---

## 🐛 Ако промените не се виждат:

### Browser Cache:
```bash
# Hard Refresh
Ctrl + Shift + R  (Windows)
Cmd + Shift + R   (Mac)

# Или отвори DevTools (F12)
Network tab → ☑️ Disable cache
```

### Gradle Resources:
```bash
# Force copy resources from src/ to build/
.\gradlew.bat clean processResources
```

---

## 📦 Build за Production

```bash
# Clean build
.\gradlew.bat clean build

# Build with production profile
.\gradlew.bat clean build -Pprofile=prod

# Създава: build/libs/SmolyanVote-1.jar
```

---

## 🌐 Deployment на Railway/Production Server

```bash
# Set environment variable на сървъра:
SPRING_PROFILES_ACTIVE=prod

# След това deploy JAR-а
```

---

## ⚙️ Configuration Files

```
src/main/resources/
├── application.properties           # Base config
├── application-dev.properties       # Development config
└── application-prod.properties      # Production config
```

---

## 🔐 Environment Variables (за Production)

```bash
SPRING_PROFILES_ACTIVE=prod
DB_PASSWORD=***
MAILJET_API_KEY=***
MAILJET_API_SECRET=***
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***
SIGHTENGINE_API_USER=***
SIGHTENGINE_API_SECRET=***
```

---

## 📊 Performance Comparison

| Feature | Development | Production |
|---------|-------------|------------|
| Static Cache | ❌ 0 sec | ✅ 1 year |
| Thymeleaf Cache | ❌ Disabled | ✅ Enabled |
| Compression | ❌ No | ✅ Yes |
| Error Details | ✅ Shown | ❌ Hidden |
| DevTools | ✅ Enabled | ❌ Disabled |
| Page Load | 🐌 Slower | ⚡ Fast |

---

## 🎓 Best Practices

### Development:
- ✅ Използвай `dev` profile
- ✅ Disable browser cache (F12 → Network → Disable cache)
- ✅ Остави DevTools отворен
- ✅ Използвай `bootRunDev`

### Production:
- ✅ Използвай `prod` profile
- ✅ Enable compression
- ✅ Secure cookies
- ✅ Hide error stacktraces
- ✅ Build с `clean build`

---

## ❓ FAQ

**Q: Защо промените не се виждат?**
A: Hard refresh (`Ctrl + Shift + R`) или `.\gradlew.bat clean processResources`

**Q: Кой profile използвам сега?**
A: Виж в конзолата при старт: `The following profiles are active: dev`

**Q: Как да сменя profile?**
A: Set `SPRING_PROFILES_ACTIVE` environment variable или използвай `bootRunDev`/`bootRunProd`

**Q: DevTools работи ли на production?**
A: НЕ! Автоматично се disable-ва с `prod` profile.

---

Made with ❤️ by SmolyanVote Team

