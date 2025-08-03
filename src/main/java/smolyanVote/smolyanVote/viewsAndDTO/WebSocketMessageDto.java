package smolyanVote.smolyanVote.viewsAndDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

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
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
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

    // ===== CONSTRUCTORS =====

    public WebSocketMessageDto() {
        this.timestamp = LocalDateTime.now();
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
        return new WebSocketMessageDto("ping", "ping");
    }

    /**
     * Създава pong съобщение
     */
    public static WebSocketMessageDto pong() {
        return new WebSocketMessageDto("pong", "pong");
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
     * Връща данните като конкретен тип (с casting)
     */
    @SuppressWarnings("unchecked")
    public <T> T getDataAs(Class<T> clazz) {
        if (data != null && clazz.isAssignableFrom(data.getClass())) {
            return (T) data;
        }
        return null;
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

    // ===== UTILITY =====

    @Override
    public String toString() {
        return "WebSocketMessageDto{" +
                "type='" + type + '\'' +
                ", status='" + status + '\'' +
                ", message='" + message + '\'' +
                ", timestamp=" + timestamp +
                ", dataType=" + (data != null ? data.getClass().getSimpleName() : "null") +
                '}';
    }
}