# 🚀 SVMessenger - Deployment Guide

## 📋 Общ преглед

SVMessenger е Facebook Messenger-style чат система, интегрирана в SmolyanVote платформата. Системата включва:

- **Backend**: Spring Boot + WebSocket + MySQL
- **Frontend**: React-like JavaScript + CSS
- **Real-time**: STOMP over WebSocket
- **Security**: Session-based authentication

## 🛠️ Технически изисквания

### Backend
- Java 17+
- Spring Boot 3.4.4
- MySQL 8.0+
- WebSocket support

### Frontend
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- WebSocket support

## 📦 Инсталация

### 1. Database Setup

```sql
-- Изпълни migration файла
-- src/main/resources/sql/V2025_01_22__create_svmessenger_tables.sql

-- Или използвай Hibernate auto-update
-- spring.jpa.hibernate.ddl-auto=update (вече конфигурирано)
```

### 2. Backend Configuration

SVMessenger се интегрира автоматично в съществуващата SmolyanVote конфигурация:

```properties
# WebSocket endpoint
/ws-svmessenger

# REST API endpoints
/api/svmessenger/*

# Security (вече конфигурирано)
/api/svmessenger/** - requires authentication
/ws-svmessenger/** - requires authentication
```

### 3. Frontend Integration

SVMessenger widget се зарежда автоматично във всички страници:

```html
<!-- Автоматично включване в bottomHtmlStyles.html -->
<div th:replace="~{fragments/svMessengerWidget :: svMessengerWidget}"></div>
```

## 🔧 Конфигурация

### Environment Variables

```bash
# Database (вече конфигурирано)
DB_PASSWORD=your_db_password

# WebSocket (production)
# Настрой CORS origins в SVMessengerWebSocketConfig.java
```

### Production Settings

```java
// В SVMessengerWebSocketConfig.java
registry.addEndpoint("/ws-svmessenger")
    .setAllowedOriginPatterns("https://smolyanvote.com", "https://www.smolyanvote.com")
    .withSockJS();
```

## 🚀 Deployment Steps

### 1. Build Application

```bash
# Development
./gradlew bootRun

# Production
./gradlew build
java -jar build/libs/smolyanVote-1.jar
```

### 2. Database Migration

```bash
# Ако използваш Flyway/Liquibase
# Изпълни V2025_01_22__create_svmessenger_tables.sql

# Или остави Hibernate да създаде таблиците автоматично
```

### 3. Verify Installation

```bash
# Провери WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://localhost:2662/ws-svmessenger

# Провери REST API
curl -X GET http://localhost:2662/api/svmessenger/conversations -H "Cookie: JSESSIONID=your_session_id"
```

## 📊 Monitoring

### Logs

```bash
# SVMessenger specific logs
grep "SVMessenger" logs/application.log

# WebSocket connections
grep "WebSocket" logs/application.log

# Database queries
grep "sv_conversations\|sv_messages" logs/application.log
```

### Metrics

```bash
# Actuator endpoints
curl http://localhost:2662/actuator/health
curl http://localhost:2662/actuator/metrics
```

## 🔒 Security

### Authentication
- Session-based authentication
- CSRF protection enabled
- CORS configured

### Data Protection
- Messages are encrypted in transit (HTTPS)
- Soft delete for conversations/messages
- User data isolation

### Rate Limiting
- Consider adding rate limiting for message sending
- WebSocket connection limits

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   ```bash
   # Провери firewall settings
   # Провери CORS configuration
   # Провери authentication
   ```

2. **Messages Not Sending**
   ```bash
   # Провери database connection
   # Провери user authentication
   # Провери WebSocket connection
   ```

3. **UI Not Loading**
   ```bash
   # Провери JavaScript console
   # Провери CSS loading
   # Провери user authentication
   ```

### Debug Mode

```properties
# Enable debug logging
logging.level.smolyanVote.smolyanVote.websocket.svmessenger=DEBUG
logging.level.smolyanVote.smolyanVote.services.serviceImpl.SVMessengerServiceImpl=DEBUG
```

## 📈 Performance

### Database Optimization

```sql
-- Indexes за performance (вече създадени)
CREATE INDEX idx_sv_conv_users ON sv_conversations(user1_id, user2_id);
CREATE INDEX idx_sv_conv_updated ON sv_conversations(updated_at DESC);
CREATE INDEX idx_sv_msg_conversation_sent ON sv_messages(conversation_id, sent_at DESC);
```

### Memory Management

```java
// Typing status cleanup (вече имплементирано)
// Auto-cleanup след 3 секунди
```

## 🔄 Updates

### Version Control

```bash
# Backup database
mysqldump -u root -p smolyanvote > backup_before_svmessenger.sql

# Deploy new version
./gradlew build
java -jar build/libs/smolyanVote-1.jar

# Verify functionality
curl -X GET http://localhost:2662/api/svmessenger/conversations
```

## 📞 Support

### Documentation
- API Documentation: `/api/svmessenger/*`
- WebSocket Documentation: `/ws-svmessenger`

### Contact
- Developer: SmolyanVote Team
- Email: support@smolyanvote.com

---

## ✅ Deployment Checklist

- [ ] Database tables created
- [ ] WebSocket endpoint accessible
- [ ] REST API endpoints working
- [ ] Frontend widget loading
- [ ] Authentication working
- [ ] Real-time messaging working
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] Security configured
- [ ] Monitoring enabled

---

**SVMessenger е готов за production deployment! 🎉**
