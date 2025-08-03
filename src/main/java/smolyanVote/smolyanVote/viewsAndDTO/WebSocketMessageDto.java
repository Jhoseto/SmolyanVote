package smolyanVote.smolyanVote.viewsAndDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Базов DTO клас за всички WebSocket съобщения
 * Използва се за стандартизиране на комуникацията между client и server
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebSocketMessageDto {

    /**
     * Типът на съобщението
     * Примери: "welcome", "error", "new_activity", "stats_update", "ping", "pong"
     */
    private String type;

    /**
     * Данните на съобщението - може да бъде всякакъв обект
     */
    private Object data;

    /**
     * Timestamp на съобщението
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private LocalDateTime timestamp;

    /**
     * Статус на съобщението (опционално)
     * Примери: "success", "error", "warning", "info"
     */
    private String status;

    /**
     * Съобщение за грешка или информация (опционално)
     */
    private String message;

    /**
     * Уникален ID на съобщението (опционално)
     */
    private String messageId;

    /**
     * Допълнителни метаданни (опционално)
     */
    private Map<String, Object> metadata;

    // ===== CONSTRUCTORS =====

    public WebSocketMessageDto() {
        this.timestamp = LocalDateTime.now();
        this.messageId = UUID.randomUUID().toString();
    }

    public WebSocketMessageDto(String type, Object data) {
        this();
        this.type = type;
        this.data = data;
    }

    public WebSocketMessageDto(String type, Object data, String status) {
        this(type, data);
        this.status = status;
    }

    public WebSocketMessageDto(String type, Object data, String status, String message) {
        this(type, data, status);
        this.message = message;
    }

    // ===== STATIC FACTORY METHODS =====

    /**
     * Създава success съобщение
     */
    public static WebSocketMessageDto success(String type, Object data) {
        return new WebSocketMessageDto(type, data, "success");
    }

    /**
     * Създава success съобщение с текст
     */
    public static WebSocketMessageDto success(String type, Object data, String message) {
        return new WebSocketMessageDto(type, data, "success", message);
    }

    /**
     * Създава error съобщение
     */
    public static WebSocketMessageDto error(String errorMessage) {
        return new WebSocketMessageDto("error", null, "error", errorMessage);
    }

    /**
     * Създава error съобщение с данни
     */
    public static WebSocketMessageDto error(String type, Object data, String errorMessage) {
        return new WebSocketMessageDto(type, data, "error", errorMessage);
    }

    /**
     * Създава info съобщение
     */
    public static WebSocketMessageDto info(String type, Object data, String message) {
        return new WebSocketMessageDto(type, data, "info", message);
    }

    /**
     * Създава warning съобщение
     */
    public static WebSocketMessageDto warning(String type, Object data, String message) {
        return new WebSocketMessageDto(type, data, "warning", message);
    }

    /**
     * Създава ping съобщение
     */
    public static WebSocketMessageDto ping() {
        WebSocketMessageDto dto = new WebSocketMessageDto("ping", "ping");
        dto.setStatus("info");
        return dto;
    }

    /**
     * Създава pong съобщение
     */
    public static WebSocketMessageDto pong() {
        WebSocketMessageDto dto = new WebSocketMessageDto("pong", "pong");
        dto.setStatus("info");
        return dto;
    }

    /**
     * Създава pong отговор на ping
     */
    public static WebSocketMessageDto pongResponse(String originalMessageId) {
        WebSocketMessageDto dto = new WebSocketMessageDto("pong", "pong");
        dto.setStatus("info");
        dto.addMetadata("originalMessageId", originalMessageId);
        return dto;
    }

    /**
     * Създава welcome съобщение
     */
    public static WebSocketMessageDto welcome(String handlerName, Map<String, Object> sessionData) {
        WebSocketMessageDto dto = new WebSocketMessageDto("welcome", sessionData, "success",
                "Connected to " + handlerName);
        dto.addMetadata("handlerName", handlerName);
        return dto;
    }

    /**
     * Създава system съобщение
     */
    public static WebSocketMessageDto system(String message, String level) {
        Map<String, Object> systemData = new HashMap<>();
        systemData.put("message", message);
        systemData.put("level", level);
        systemData.put("timestamp", LocalDateTime.now());

        return new WebSocketMessageDto("system_message", systemData, level, message);
    }

    /**
     * Създава heartbeat съобщение
     */
    public static WebSocketMessageDto heartbeat() {
        WebSocketMessageDto dto = new WebSocketMessageDto("heartbeat", LocalDateTime.now());
        dto.setStatus("info");
        dto.setMessage("Keep-alive heartbeat");
        return dto;
    }

    /**
     * Създава notification съобщение
     */
    public static WebSocketMessageDto notification(String title, String body, String level) {
        Map<String, Object> notificationData = new HashMap<>();
        notificationData.put("title", title);
        notificationData.put("body", body);
        notificationData.put("level", level);
        notificationData.put("timestamp", LocalDateTime.now());

        return new WebSocketMessageDto("notification", notificationData, level, title);
    }

    /**
     * Създава command response съобщение
     */
    public static WebSocketMessageDto commandResponse(String command, Object result, boolean success) {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("command", command);
        responseData.put("result", result);
        responseData.put("success", success);

        String status = success ? "success" : "error";
        String message = success ? "Command executed successfully" : "Command execution failed";

        return new WebSocketMessageDto("command_response", responseData, status, message);
    }

    // ===== UTILITY METHODS =====

    /**
     * Проверява дали съобщението е от определен тип
     */
    public boolean isType(String type) {
        return this.type != null && this.type.equals(type);
    }

    /**
     * Проверява дали съобщението е success
     */
    public boolean isSuccess() {
        return "success".equals(this.status);
    }

    /**
     * Проверява дали съобщението е error
     */
    public boolean isError() {
        return "error".equals(this.status);
    }

    /**
     * Проверява дали съобщението е warning
     */
    public boolean isWarning() {
        return "warning".equals(this.status);
    }

    /**
     * Проверява дали съобщението е info
     */
    public boolean isInfo() {
        return "info".equals(this.status);
    }

    /**
     * Проверява дали е ping съобщение
     */
    public boolean isPing() {
        return "ping".equals(this.type);
    }

    /**
     * Проверява дали е pong съобщение
     */
    public boolean isPong() {
        return "pong".equals(this.type);
    }

    /**
     * Проверява дали е system съобщение
     */
    public boolean isSystemMessage() {
        return "system_message".equals(this.type);
    }

    /**
     * Добавя метаданни
     */
    public WebSocketMessageDto addMetadata(String key, Object value) {
        if (this.metadata == null) {
            this.metadata = new HashMap<>();
        }
        this.metadata.put(key, value);
        return this;
    }

    /**
     * Добавя множество метаданни
     */
    public WebSocketMessageDto addMetadata(Map<String, Object> additionalMetadata) {
        if (this.metadata == null) {
            this.metadata = new HashMap<>();
        }
        this.metadata.putAll(additionalMetadata);
        return this;
    }

    /**
     * Извлича метаданни по ключ
     */
    public Object getMetadata(String key) {
        return this.metadata != null ? this.metadata.get(key) : null;
    }

    /**
     * Проверява дали има метаданни
     */
    public boolean hasMetadata() {
        return this.metadata != null && !this.metadata.isEmpty();
    }

    /**
     * Клонира съобщението с нов тип
     */
    public WebSocketMessageDto withType(String newType) {
        WebSocketMessageDto cloned = new WebSocketMessageDto();
        cloned.type = newType;
        cloned.data = this.data;
        cloned.timestamp = this.timestamp;
        cloned.status = this.status;
        cloned.message = this.message;
        cloned.messageId = this.messageId;
        cloned.metadata = this.metadata != null ? new HashMap<>(this.metadata) : null;
        return cloned;
    }

    /**
     * Клонира съобщението с нови данни
     */
    public WebSocketMessageDto withData(Object newData) {
        WebSocketMessageDto cloned = new WebSocketMessageDto();
        cloned.type = this.type;
        cloned.data = newData;
        cloned.timestamp = this.timestamp;
        cloned.status = this.status;
        cloned.message = this.message;
        cloned.messageId = this.messageId;
        cloned.metadata = this.metadata != null ? new HashMap<>(this.metadata) : null;
        return cloned;
    }

    /**
     * Проверява дали съобщението е валидно
     */
    public boolean isValid() {
        return this.type != null && !this.type.trim().isEmpty();
    }

    /**
     * Връща размер на данните (приблизително)
     */
    public int getApproximateSize() {
        int size = 0;

        if (type != null) size += type.length();
        if (message != null) size += message.length();
        if (messageId != null) size += messageId.length();
        if (status != null) size += status.length();

        // Приблизителен размер на data (не е точен, но дава представа)
        if (data != null) {
            size += data.toString().length();
        }

        return size;
    }

    /**
     * Проверява дали съобщението е прекалено голямо
     */
    public boolean isTooLarge(int maxSize) {
        return getApproximateSize() > maxSize;
    }

    // ===== GETTERS AND SETTERS =====

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    @Override
    public String toString() {
        return "WebSocketMessageDto{" +
                "type='" + type + '\'' +
                ", status='" + status + '\'' +
                ", message='" + message + '\'' +
                ", messageId='" + messageId + '\'' +
                ", timestamp=" + timestamp +
                ", hasData=" + (data != null) +
                ", hasMetadata=" + hasMetadata() +
                '}';
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;

        WebSocketMessageDto that = (WebSocketMessageDto) obj;
        return messageId != null ? messageId.equals(that.messageId) : that.messageId == null;
    }

    @Override
    public int hashCode() {
        return messageId != null ? messageId.hashCode() : 0;
    }
}