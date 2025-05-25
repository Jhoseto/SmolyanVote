package smolyanVote.smolyanVote.models.enums;

/**
 * Представлява изброяване на всички населени места в област Смолян, подредени по азбучен ред по кирилица, с водещ Смолян.
 */
public enum Locations {
    NONE("-"),
    SMOLYAN("Смолян"),
    PAMPOROVO("Пампорово"),
    MADAN("Мадан"),
    RUDOZEM("Рудозем"),
    CHEPELEARE("Чепеларе"),
    ZLATOGRAD("Златоград"),
    АLIGOVSKA("Алиговска"),
    ARDA("Арда"),
    BELEV_DOL("Белев дол"),
    BILYANSKA("Билянска"),
    BORIKOVO("Бориково"),
    BOSTINA("Бостина"),
    BUKATA("Буката"),
    BUKATSITE("Букаците"),
    VIEVO("Виево"),
    VLAKHOVO("Влахово"),
    VARBOVO("Върбово"),
    GABRITSA("Габрица"),
    GELA("Гела"),
    GOZDEVITSA("Гоздевица"),
    GORNA_ARDA("Горна Арда"),
    GOROVO("Горово"),
    GRADAT("Градът"),
    GUDEVITSA("Гудевица"),
    DUNEVO("Дунево"),
    DIMOVO("Димово"),
    ZAEVITE("Заевите"),
    ZMIEVO("Змиево"),
    ELENSKA("Еленска"),
    ELYOVO("Ельово"),
    ZHASOVITSA("Хасовица"),
    ISYOVTSI("Исьовци"),
    KATRANITSA("Катраница"),
    KISELICHEVO("Киселичево"),
    KOKORKOVO("Кокорково"),
    KOSHNITSA("Кошница"),
    KREMENE("Кремене"),
    KUKUVITSA("Кукувица"),
    KUTELA("Кутела"),
    LAKA("Лъка"),
    LEVOCHEVO("Левочево"),
    LIPETS("Липец"),
    LYULKA("Люлка"),
    MILKOVO("Милково"),
    MOGILITSA("Могилица"),
    MOMCHILOVTSI("Момчиловци"),
    MUGLA("Мугла"),
    NADARTSI("Надарци"),
    ORESHITSA("Орешица"),
    OSTRI_PAZLAK("Острипазлак"),
    PETKOVO("Петково"),
    PESHTERA("Пещера"),
    PISANITSA("Писаница"),
    PODVIS("Подвис"),
    POLKOVNIK_SERAFIMOVO("Полковник Серафимово"),
    POPRELKA("Попрелка"),
    POTOKA("Потока"),
    RECHANI("Речани"),
    REKA("Река"),
    ROVINA("Ровина"),
    SELISHTE("Селище"),
    SHIROKA_LAKA("Широка лъка"),
    SIVINO("Сивино"),
    SLAVEYNO("Славейно"),
    SMILYAN("Смилян"),
    SOKOLOVTSI("Соколовци"),
    SOLISHTA("Солища"),
    SREDOK("Средок"),
    STIKAL("Стикъл"),
    STOYKITE("Стойките"),
    STRAZHA("Стража"),
    SARNINO("Сърнино"),
    TARAN("Търън"),
    TIKALE("Тикале"),
    TREBISHTE("Требище"),
    TURYAN("Турян"),
    UHLOVITSA("Ухловица"),
    CHAMLA("Чамла"),
    CHEPLETEN("Чеплетен"),
    CHERESHOVO("Черешово"),
    CHERESHOVSKA_REKA("Черешовска река"),
    CHERESHKITE("Черешките"),
    CHOKMANOVO("Чокманово"),
    CHUCHUR("Чучур");



    private final String bgName;

    Locations(String bgName) {
        this.bgName = bgName;
    }

    public String toBG() {
        return bgName;
    }
}
