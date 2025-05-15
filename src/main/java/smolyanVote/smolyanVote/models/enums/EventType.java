package smolyanVote.smolyanVote.models.enums;

public enum EventType {
    SIMPLEEVENT("ОПРОСТЕН ВИД СЪБИТИЕ"),

    REFERENDUM("РЕФЕРЕНДУМ"),

    SIMPLEPOLL("ОПРОСТЕНА АНКЕТА"),

    POLL("АНКЕТА");


    private final String BG;

    EventType(String bg) {
        this.BG = bg;
    }

    public String toBG() {
        return BG;
    }
}
