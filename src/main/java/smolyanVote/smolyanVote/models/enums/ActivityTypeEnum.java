package smolyanVote.smolyanVote.models.enums;

public enum ActivityTypeEnum {
    SIMPLEEVENT("ОПРОСТЕН ВИД СЪБИТИЕ"),
    REFERENDUM("РЕФЕРЕНДУМ"),
    MULTI_POLL("АНКЕТА С МНОЖЕСТВЕН ИЗБОР"),
    PUBLICATION("ПУБЛИКАЦИЯ"),
    SIGNAL("Сигнал"),
    COMMENT("Коментар"),
    USER("Потребител"),
    SYSTEM("Система"),
    REPORT("РЕПОРТ"),
    DEFAULT("НЯМА ВИД"),;


    private final String BG;

    ActivityTypeEnum(String bg) {
        this.BG = bg;
    }

    public String toBG() {
        return BG;
    }

}