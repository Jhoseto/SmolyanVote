package smolyanVote.smolyanVote.annotations;

import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Анотация за автоматично логване на потребителски активности
 * Използва се с AOP за записване в activity_logs таблицата
 *
 * Примери:
 * @LogActivity(action = ActivityActionEnum.CREATE_PUBLICATION)
 * public PublicationEntity createPublication(...) { ... }
 *
 * @LogActivity(action = ActivityActionEnum.CREATE_COMMENT, targetEntityType = EventType.PUBLICATION)
 * public CommentsEntity addCommentToPublication(Long publicationId, String text, ...) { ... }
 *
 * @LogActivity(action = ActivityActionEnum.LIKE_COMMENT, entityIdParam = "commentId")
 * public boolean likeComment(Long commentId, ...) { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogActivity {

    /**
     * Типът действие (задължително)
     * Примери: ActivityActionEnum.CREATE_PUBLICATION, ActivityActionEnum.USER_LOGIN
     */
    ActivityActionEnum action();

    /**
     * Legacy support - String action (използвайте enum-а вместо това)
     * @deprecated Използвайте action() с ActivityActionEnum enum
     */
    @Deprecated
    String actionString() default "";

    /**
     * Типът на entity-то (автоматично се извлича от action-а ако не е зададено)
     * Примери: EventType.PUBLICATION, EventType.SIMPLEEVENT, EventType.REFERENDUM
     *
     * За CREATE_PUBLICATION -> автоматично PUBLICATION
     * За CREATE_COMMENT -> автоматично DEFAULT (защото коментарът не е основно entity)
     */
    ActivityTypeEnum entityType() default ActivityTypeEnum.DEFAULT;

    /**
     * Target entity type - за действия върху други entity-та
     * Примери: коментар към публикация -> targetEntityType = PUBLICATION
     * Лайк на коментар -> targetEntityType = DEFAULT (коментарът е target-а)
     *
     * Ако е зададено, entityId ще се търси към target entity-то вместо към основното
     */
    ActivityTypeEnum targetEntityType() default ActivityTypeEnum.DEFAULT;

    /**
     * Стратегия за намиране на entity ID
     */
    EntityIdStrategy entityIdStrategy() default EntityIdStrategy.AUTO;

    /**
     * Име на параметъра, който съдържа entity ID (използва се при PARAMETER strategy)
     * Примери: "id", "publicationId", "eventId", "commentId"
     */
    String entityIdParam() default "";

    /**
     * Статично entity ID (използва се при STATIC strategy)
     */
    long entityId() default -1;

    /**
     * Custom details template със placeholder-и
     * Примери: "Category: {category}, Title: {title}", "Vote: {choice}", "Comment: {text}"
     *
     * Специални placeholder-и:
     * {resultId} - ID на резултата от метода
     * {method} - име на метода
     * {class} - име на класа
     */
    String details() default "";

    /**
     * Автоматично включване на заглавие/тема в детайлите
     * Търси параметри: title, topic, name, subject
     */
    boolean includeTitle() default true;

    /**
     * Автоматично включване на текст/съдържание в детайлите
     * Търси параметри: text, content, message, description
     * Ограничава до 100 символа автоматично
     */
    boolean includeText() default true;

    /**
     * Автоматично включване на избор/глас в детайлите
     * Търси параметри: choice, option, voteChoice, selectedOption
     */
    boolean includeChoice() default false;

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

    /**
     * Enum за стратегии на намиране на entity ID
     */
    enum EntityIdStrategy {
        /**
         * Автоматично търсене - първо в параметрите, после в резултата
         */
        AUTO,

        /**
         * Търси само в параметрите на метода
         * Използва entityIdParam ако е зададен, иначе общи имена
         */
        PARAMETER,

        /**
         * Взима ID от резултата на метода (result.getId())
         */
        RESULT,

        /**
         * Използва статичната стойност от entityId
         */
        STATIC
    }
}