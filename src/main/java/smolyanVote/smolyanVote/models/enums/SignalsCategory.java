package smolyanVote.smolyanVote.models.enums;

public enum SignalsCategory {
    // Инфраструктура
    ROAD_DAMAGE("Дупки в пътищата"),
    SIDEWALK_DAMAGE("Счупени тротоари"),
    LIGHTING("Неработещо осветление"),
    TRAFFIC_SIGNS("Повредени пътни знаци"),
    WATER_SEWER("Водопровод/канализация"),

    // Околна среда
    WASTE_MANAGEMENT("Замърсяване на околната среда"),
    ILLEGAL_DUMPING("Незаконно изхвърляне на отпадъци"),
    TREE_ISSUES("Проблеми с дървета и растителност"),
    AIR_POLLUTION("Замърсяване на въздуха"),
    NOISE_POLLUTION("Шумово замърсяване"),

    // Обществени услуги
    HEALTHCARE("Здравеопазване"),
    EDUCATION("Образование"),
    TRANSPORT("Обществен транспорт"),
    PARKING("Паркиране"),

    // Безопасност
    SECURITY("Обществена безопасност"),
    VANDALISM("Вандализъм"),
    ACCESSIBILITY("Достъпност"),

    // Други
    OTHER("Други");

    private final String displayName;

    SignalsCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}