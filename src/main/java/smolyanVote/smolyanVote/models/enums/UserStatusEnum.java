package smolyanVote.smolyanVote.models.enums;

public enum UserStatusEnum {
   
    PENDING_ACTIVATION ("Чака Емейл потвърждение"), // регистриран, чака email confirmation
    ACTIVE("Активен"), // нормален активен потребител
    TEMPORARILY_BANNED("Временно баннат"), // ban с изтичаща дата
    PERMANENTLY_BANNED("Перманентно баннат");

    private final String bgName;

    UserStatusEnum(String bgName) {
        this.bgName = bgName;
    }

    public String toBG() {
        return bgName;
    }
}
