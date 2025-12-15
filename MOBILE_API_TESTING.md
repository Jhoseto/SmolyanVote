# 🧪 Mobile API Testing Guide

## ✅ Компилация и Build

### Проверка на компилацията
```bash
./gradlew compileJava --no-daemon
```

**Резултат**: ✅ BUILD SUCCESSFUL (без грешки, само 1 warning за @Builder)

### Проверка на зависимостите
```bash
./gradlew dependencies --configuration runtimeClasspath | grep jjwt
```

Очаквани зависимости:
- `io.jsonwebtoken:jjwt-api:0.12.5`
- `io.jsonwebtoken:jjwt-impl:0.12.5`
- `io.jsonwebtoken:jjwt-jackson:0.12.5`

## 🚀 Стартиране на приложението

**ВАЖНО**: Според настройките, приложението трябва да се стартира ръчно:

```bash
./gradlew bootRun
```

Приложението ще стартира на: `http://localhost:2662`

## 📋 Тестови Endpoints

### 1. Health Check
```bash
GET http://localhost:2662/actuator/health
```

### 2. Mobile Login
```bash
POST http://localhost:2662/api/mobile/auth/login
Content-Type: application/json

{
  "email": "krupek@smolyanvote.com",
  "password": "Krupek2025"
}
```

**Очакван Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "username": "krupek",
    "fullName": "...",
    "imageUrl": "...",
    "isOnline": true
  }
}
```

### 3. Refresh Token
```bash
POST http://localhost:2662/api/mobile/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Очакван Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### 4. Protected Endpoint (с JWT)
```bash
GET http://localhost:2662/api/svmessenger/conversations
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 5. Logout
```bash
POST http://localhost:2662/api/mobile/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Очакван Response**:
```json
{
  "success": true,
  "message": "Успешно излизане"
}
```

### 6. Device Token Registration
```bash
POST http://localhost:2662/api/mobile/device/register
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "deviceToken": "fcm-token-or-apns-token",
  "platform": "android",
  "deviceId": "optional-device-id",
  "appVersion": "1.0.0"
}
```

## 🧪 Автоматично тестване

Използвай PowerShell скрипта `test-mobile-api.ps1`:

```powershell
.\test-mobile-api.ps1
```

Скриптът автоматично:
1. Проверява дали сървърът работи
2. Тества login endpoint
3. Тества protected endpoint с JWT
4. Тества token refresh
5. Тества logout

## 🔍 Проверка на JWT Token

### Decode JWT Token (без валидация)
Можеш да използваш онлайн tool като https://jwt.io за да видиш съдържанието на token-а.

### Очаквани Claims в Access Token:
```json
{
  "userId": 1,
  "username": "krupek",
  "email": "krupek@smolyanvote.com",
  "role": "USER",
  "type": "ACCESS",
  "sub": "krupek@smolyanvote.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Очаквани Claims в Refresh Token:
```json
{
  "userId": 1,
  "type": "REFRESH",
  "sub": "krupek@smolyanvote.com",
  "iat": 1234567890,
  "exp": 1234643490
}
```

## 🐛 Troubleshooting

### Проблем: "No access token available"
- Провери дали login endpoint връща accessToken
- Провери дали token-ът е правилно изпратен в Authorization header

### Проблем: "401 Unauthorized"
- Провери дали token-ът не е изтекъл
- Провери дали token-ът е правилно форматиран: `Bearer <token>`
- Провери дали user-ът е активен (не е PENDING_ACTIVATION)

### Проблем: "Token validation failed"
- Провери дали JWT secret е правилно конфигуриран в `application.properties`
- Провери дали token-ът не е променен или повреден

### Проблем: "WebSocket connection failed"
- Провери дали WebSocket endpoint е достъпен: `ws://localhost:2662/ws-svmessenger`
- Провери дали JWT token е изпратен в connection headers
- Провери CORS настройките

## 📊 Database Schema

### Mobile Device Tokens Table
Таблицата `mobile_device_tokens` се създава автоматично при стартиране на приложението (Hibernate `ddl-auto=update`).

Структура:
- `id` (BIGINT, PRIMARY KEY)
- `user_id` (BIGINT, FOREIGN KEY -> users.id)
- `device_token` (VARCHAR(500))
- `platform` (VARCHAR(20)) - "ios" или "android"
- `device_id` (VARCHAR(255), nullable)
- `app_version` (VARCHAR(50), nullable)
- `last_used_at` (TIMESTAMP)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## ✅ Checklist за тестване

- [ ] Backend компилира без грешки
- [ ] Приложението стартира успешно
- [ ] Health endpoint работи
- [ ] Login endpoint връща JWT tokens
- [ ] JWT token работи за protected endpoints
- [ ] Token refresh работи
- [ ] Logout работи
- [ ] Device token registration работи
- [ ] WebSocket connection с JWT работи
- [ ] Push notifications service е конфигуриран (Firebase setup остава)

## 🔐 Security Notes

1. **JWT Secret**: В production трябва да се използва силен secret key (минимум 256 бита)
2. **HTTPS**: В production всички API calls трябва да са през HTTPS
3. **Token Expiration**: Access tokens изтичат след 1 час, refresh tokens след 7 дни
4. **CORS**: В production трябва да се ограничат разрешените origins

