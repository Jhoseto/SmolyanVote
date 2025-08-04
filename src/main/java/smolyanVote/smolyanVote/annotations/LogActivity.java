package smolyanVote.smolyanVote.annotations;

import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.EventType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Анотация за автоматично логване на потребителски активности
 * Използва се с AOP за записване в activity_logs таблицата
 *
 * Пример:
 * @LogActivity(action = ActivityActionEnum.CREATE_PUBLICATION, entityType = "PUBLICATION")
 * public PublicationEntity createPublication(...) { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogActivity {

    /**
     * Типът действие (препоръчително - използвайте ActivityActionEnum enum)
     * Примери: ActivityActionEnum.CREATE_PUBLICATION, ActivityActionEnum.USER_LOGIN
     */
    ActivityActionEnum action() default ActivityActionEnum.API_ACCESS;

    /**
     * Legacy support - String action (използвайте enum-а вместо това)
     * @deprecated Използвайте action() с ActivityActionEnum enum
     */
    @Deprecated
    String actionString() default "";

    /**
     * Типът на entity-то (опционално)
     * Примери: "PUBLICATION", "EVENT", "REFERENDUM", "USER"
     */
    EventType entityType() default EventType.DEFAULT;

    /**
     * Име на параметъра, който съдържа entity ID (опционално)
     * Примери: "id", "publicationId", "eventId"
     *
     * Ако не е зададено, Aspect-ът ще търси параметри с имена:
     * "id", "entityId", "{entityType}Id" (например "publicationId")
     */
    String entityIdParam() default "";

    /**
     * Статично entity ID (ако не зависи от параметри)
     */
    long entityId() default -1;

    /**
     * Допълнителни детайли за записване (опционално)
     * Може да съдържа placeholder-и като {param} за динамично заместване
     * Пример: "Category: {category}, Title: {title}"
     */
    String details() default "";

    /**
     * Дали да записва активността само при успешно изпълнение (default: true)
     * Ако е false, ще записва дори при exception
     */
    boolean onSuccessOnly() default true;

    /**
     * Дали да записва активността асинхронно (default: true)
     * Препоръчва се true за по-добра производителност
     */
    boolean async() default true;
}