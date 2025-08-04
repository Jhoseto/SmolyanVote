package smolyanVote.smolyanVote.models.enums;

public enum EventType {
    SIMPLEEVENT("ОПРОСТЕН ВИД СЪБИТИЕ"),

    REFERENDUM("РЕФЕРЕНДУМ"),

    MULTI_POLL("АНКЕТА С МНОЖЕСТВЕН ИЗБОР"),
    POLL("АНКЕТА"),

    PUBLICATION("ПУБЛИКАЦИЯ"),

    SIGNAL("СИГНАЛ"),

    REPORT("РЕПОРТ"),

    DEFAULT("НЯМА ВИД"),;


    private final String BG;

    EventType(String bg) {
        this.BG = bg;
    }

    public String toBG() {
        return BG;
    }

}