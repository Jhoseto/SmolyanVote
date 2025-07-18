package smolyanVote.smolyanVote.models.enums;

public enum SignalsCategory {
    ROAD_DAMAGE("Повредени пътища"),
    INFRASTRUCTURE("Инфраструктурни проблеми"),
    LIGHTING("Проблеми с осветлението"),
    WATER_SEWER("Водопровод и канализация"),
    PARKS_GREEN("Паркове и зелени площи"),
    TRAFFIC("Движение и паркиране"),
    NOISE("Шум и замърсяване"),
    VANDALISM("Вандализъм"),
    ABANDONED_VEHICLES("Изоставени автомобили"),
    SECURITY_ISSUES("Проблеми с безопасност"),
    WASTE_COLLECTION("Проблеми със сметосъбиране"),
    BUS_STOPS("Неработещи автобусни спирки"),
    PUBLIC_TRANSPORT("Проблеми с обществен транспорт"),
    ACCESSIBILITY("Недостъпност за хора с увреждания"),
    PLAYGROUNDS("Опасни детски площадки"),
    STRAY_ANIMALS("Бездомни животни");

    private final String displayName;

    SignalsCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}