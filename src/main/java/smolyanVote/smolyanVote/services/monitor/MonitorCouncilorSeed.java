package smolyanVote.smolyanVote.services.monitor;

import java.util.List;

/**
 * Curated municipal council rosters for oblast Smolyan (mandate 2023–2027).
 * Sources: official municipal websites, OIK/CIK results, focus-news.net (Oct–Nov 2023),
 * inauguration reports (BTA/focus). Leadership roles updated where publicly reported
 * after the constitutive sessions (e.g. ObS presidents).
 */
public final class MonitorCouncilorSeed {

    public static final String MANDATE = "2023–2027";

    private MonitorCouncilorSeed() {
    }

    public record SeedCouncilor(
            String authorityEik,
            String fullName,
            String roleLabel,
            String party,
            String sourceUrl
    ) {
    }

    public static List<SeedCouncilor> all() {
        return List.of(
                        smolyan(),
                        zlatograd(),
                        madan(),
                        rudozem(),
                        nedelino(),
                        devin(),
                        chepelare(),
                        banite())
                .stream()
                .flatMap(List::stream)
                .toList();
    }

    private static List<SeedCouncilor> smolyan() {
        String eik = MonitorRegionalConfig.SMOLYAN_CITY_EIK;
        String src = "https://www.focus-news.net/novini/regioni/Eto-koi-shte-budat-obshtinskite-suvetnici-v-Smolyan-1879017";
        String mayorSrc = "https://www.smolyan.bg";
        return List.of(
                c(eik, "Николай Мелемов", "Кмет на община", "ГЕРБ", mayorSrc),
                c(eik, "Димитър Кацаров", "Председател на ОбС", "МК „Новото време“", src),
                c(eik, "Ангел Безергянов", "Съветник", "ГЕРБ", src),
                c(eik, "Адриян Петров", "Съветник", "ГЕРБ", src),
                c(eik, "Божидар Шуманов", "Съветник", "ГЕРБ", src),
                c(eik, "Боян Симеонов", "Съветник", "ПП-ДБ", src),
                c(eik, "Валентин Кюлхански", "Съветник", "МК „Новото време“", src),
                c(eik, "Велко Хаджиев", "Съветник", "ДПС", src),
                c(eik, "Вижданка Младенова", "Съветник", "ДПС", src),
                c(eik, "Георги Пепеланов", "Съветник", "Движение „Нашият град“", src),
                c(eik, "Екатерина Гаджева", "Съветник", "ГЕРБ", src),
                c(eik, "Елена Даскалова-Радева", "Съветник", "Движение „Нашият град“", src),
                c(eik, "Емил Келешев", "Съветник", "ПП-ДБ", src),
                c(eik, "Златина Узунова", "Съветник", "Движение „Нашият град“", src),
                c(eik, "Ивайло Турналиев", "Съветник", "ПП-ДБ", src),
                c(eik, "Иван Френкев", "Съветник", "БСП за България", src),
                c(eik, "Иван Гавазов", "Съветник", "БСП за България", src),
                c(eik, "Илия Томов", "Съветник", "МК „Новото време“", src),
                c(eik, "Коста Начев", "Съветник", "МК „Новото време“", src),
                c(eik, "Марин Захариев", "Съветник", "ГЕРБ", src),
                c(eik, "Милен Журналов", "Съветник", "ДПС", src),
                c(eik, "Минчо Симов", "Съветник", "ДПС", src),
                c(eik, "Михаил Тодоров", "Съветник", "ПП-ДБ", src),
                c(eik, "Петър Мирчев", "Съветник", "ГЕРБ", src),
                c(eik, "Радой Краев", "Съветник", "Движение „Нашият град“", src),
                c(eik, "Росица Станевска", "Съветник", "МК „Новото време“", src),
                c(eik, "Стефан Сабрутев", "Съветник", "Движение „Нашият град“", src),
                c(eik, "Стоян Марев", "Съветник", "ПП-ДБ", src),
                c(eik, "Стоян Иванов", "Съветник", "ГЕРБ", src),
                c(eik, "Тодор Митов", "Съветник", "ГЕРБ", src));
    }

    private static List<SeedCouncilor> zlatograd() {
        String eik = MonitorRegionalConfig.ZLATOGRAD_EIK;
        String src = "https://www.zlatograd.bg/obshtinski-savet/obshtinski-savetnitsi";
        String mayorSrc = "https://www.zlatograd.bg";
        return List.of(
                c(eik, "Мирослав Янчев", "Кмет на община", "ГЕРБ", mayorSrc),
                c(eik, "Емилия Младенова Кръстева", "Председател на ОбС", null, src),
                c(eik, "Жечка Емилова Хаджийска-Партаджиева", "Зам.-председател на ОбС", null, src),
                c(eik, "Милко Александров Караджов", "Председател на ПК „Бюджет и финанси“", null, src),
                c(eik, "Александър Фердов Илийков", "Съветник", null, src),
                c(eik, "Антон Славчев Симеонов", "Съветник", null, src),
                c(eik, "Асен Райчев Хасапчиев", "Съветник", null, src),
                c(eik, "Борислав Филипов Хаджиев", "Съветник", null, src),
                c(eik, "Владимир Ликов", "Съветник", null, src),
                c(eik, "Невена Христова Николова-Александрова", "Съветник", null, src),
                c(eik, "Веселин Николаев Иванов", "Съветник", null, src),
                c(eik, "Емил Минков Хумчев", "Съветник", null, src),
                c(eik, "Д-р Ерол Реджеб Чинар", "Съветник", null, src),
                c(eik, "Инж. Искрен Асенов Караметулов", "Съветник", null, src),
                c(eik, "Йорданка Емануилова Романова", "Съветник", null, src),
                c(eik, "Светлозар Веселинов Пехливанов", "Съветник", null, src),
                c(eik, "Станимир Митков Чаушев", "Съветник", null, src),
                c(eik, "Станислав Стефанов Гюнелиев", "Съветник", null, src));
    }

    private static List<SeedCouncilor> madan() {
        String eik = MonitorRegionalConfig.MADAN_EIK;
        String src = "https://www.obs.madan.bg/stuktura/obshtinski-savetnici.html";
        String mayorSrc = "https://www.obs.madan.bg";
        return List.of(
                c(eik, "Фахри Молайсенов", "Кмет на община", null, mayorSrc),
                c(eik, "Бедри Шукриев Базеников", "Председател на ОбС", null, src),
                c(eik, "Николай Пашов", "Зам.-председател на ОбС", null, src),
                c(eik, "Садък Садък", "Зам.-председател на ОбС", null, src),
                c(eik, "Аида Пенева", "Съветник", null, src),
                c(eik, "Бехчет Сираков", "Съветник", null, src),
                c(eik, "Валентин Матолов", "Съветник", null, src),
                c(eik, "Атанас Боровински", "Съветник", null, src),
                c(eik, "Валя Котелска", "Съветник", null, src),
                c(eik, "Владимир Фиданов", "Съветник", null, src),
                c(eik, "Зейди Карасули", "Съветник", null, src),
                c(eik, "Новка Младенова", "Съветник", null, src),
                c(eik, "Алекс Айренски", "Съветник", null, src),
                c(eik, "Филип Чукаров", "Съветник", null, src),
                c(eik, "Хайри Имамов", "Съветник", null, src),
                c(eik, "Хасан Чиев", "Съветник", null, src),
                c(eik, "Хилми Кадиев", "Съветник", null, src),
                c(eik, "Юксел Меков", "Съветник", null, src));
    }

    private static List<SeedCouncilor> rudozem() {
        String eik = MonitorRegionalConfig.RUDOZEM_EIK;
        String src = "https://rudozem.bg/subsection-104-systav_na_obschinski_sy.html";
        String mayorSrc = "https://rudozem.bg";
        return List.of(
                c(eik, "инж. Недко Кулевски", "Кмет на община", null, mayorSrc),
                c(eik, "инж. Венцислав Венциславов Пехливанов", "Председател на ОбС", null, src),
                c(eik, "Диан Фиданов Малеков", "Зам.-председател на ОбС", null, src),
                c(eik, "Николина Ангелова Костадинова", "Зам.-председател на ОбС", null, src),
                c(eik, "Димитър Радославов Мадански", "Съветник", null, src),
                c(eik, "Семир Севдалинов Сираков", "Съветник", null, src),
                c(eik, "Александър Еминов Гюров", "Съветник", null, src),
                c(eik, "Хайридин Хайриев Молабрахимов", "Съветник", null, src),
                c(eik, "Денис Минков Кедиков", "Съветник", null, src),
                c(eik, "инж. Радослав Валентинов Филизов", "Съветник", null, src),
                c(eik, "Шукри Асанов Халилов", "Съветник", null, src),
                c(eik, "Николай Бисеров Михтарски", "Съветник", null, src),
                c(eik, "инж. Евелин Веселинов Бозов", "Съветник", null, src));
    }

    private static List<SeedCouncilor> nedelino() {
        String eik = MonitorRegionalConfig.NEDELINO_EIK;
        String src = "https://nedelino.bg/person-category/obs-nedelino/";
        String mayorSrc = "https://nedelino.bg";
        return List.of(
                c(eik, "Боян Кехайов", "Кмет на община", null, mayorSrc),
                c(eik, "Веселин Данчев Кехайов", "Председател на ОбС", "ДПС – Ново начало", src),
                c(eik, "Благовест Бориславов Босев", "Съветник", "ПП-ДБ", src),
                c(eik, "Ружо Асенов Младенов", "Съветник", "ПП-ДБ", src),
                c(eik, "Стефан Иванов Гьоладжиев", "Съветник", "ПП-ДБ", src),
                c(eik, "Даниел Альошев Чандъров", "Съветник", "ПП-ДБ", src),
                c(eik, "Стоян Боянов Митев", "Съветник", "ПП-ДБ", src),
                c(eik, "Асен Емилов Белев", "Съветник", "ПП-ДБ", src),
                c(eik, "Огнян Стойков Бабачев", "Съветник", "ДПС – Ново начало", src),
                c(eik, "Румен Русинов Русанов", "Съветник", "ДПС – Ново начало", src),
                c(eik, "Бойко Ангелов Симеонов", "Съветник", "ДПС – Ново начало", src),
                c(eik, "Стойко Димитров Еленов", "Съветник", "ГЕРБ", src),
                c(eik, "Владимир Христов Петров", "Съветник", "ГЕРБ", src),
                c(eik, "Румен Асенов Младенов", "Съветник", "БСП за България", src));
    }

    private static List<SeedCouncilor> devin() {
        String eik = MonitorRegionalConfig.DEVIN_EIK;
        String src = "https://devin.bg/index.php?option=com_content&view=article&id=8561";
        String mayorSrc = "https://devin.bg";
        return List.of(
                c(eik, "Здравко Иванов", "Кмет на община", null, mayorSrc),
                c(eik, "Карамфил Фиданов Каров", "Председател на ОбС", null, src),
                c(eik, "Николай Петров Люнчев", "Председател на ПК „Бюджет и финанси“", null, src),
                c(eik, "Ангел Асенов Ликов", "Председател на ПК „УТОССГС“", null, src),
                c(eik, "Дияна Асенова Чаушева", "Председател на ПК „ОМДСТК“", null, src),
                c(eik, "Леман Салиева Фезова", "Председател на ПК „ЗСПЕ“", null, src),
                c(eik, "Ивайло Юриев Тодоров", "Председател на ПК по противодействие на корупцията", null, src),
                c(eik, "Наташа Владимирова Василева", "Председател на ПК „Етика“", null, src),
                c(eik, "Роксена Севдалинова Чавдарова", "Съветник", null, src),
                c(eik, "Елена Стефанова Сакалийска", "Съветник", null, src),
                c(eik, "Велизар Викторов Шанов", "Съветник", null, src),
                c(eik, "Джамал Шукриев Уруков", "Съветник", null, src),
                c(eik, "Владимир Елинов Буцов", "Съветник", null, src),
                c(eik, "Юри Юриев Поюклийски", "Съветник", null, src),
                c(eik, "Хожгюн Ниязиева Имамска", "Съветник", null, src),
                c(eik, "Владимир Стойчев Георгиев", "Съветник", null, src),
                c(eik, "Бинка Северинова Коруева", "Съветник", null, src),
                c(eik, "Венета Стамова Тодорова", "Съветник", null, src));
    }

    private static List<SeedCouncilor> chepelare() {
        String eik = MonitorRegionalConfig.CHEPELARE_EIK;
        String src = "https://bg.wikipedia.org/wiki/Чепеларе_(община)";
        String mayorSrc = "https://chepelare.bg";
        return List.of(
                c(eik, "Боран Хаджиев", "Кмет на община", "ГЕРБ", mayorSrc),
                c(eik, "Слава Пепеланова", "Председател на ОбС", "БСП за България", src),
                c(eik, "Екатерина Петрова", "Съветник", "Левицата!", src),
                c(eik, "Елена Лапавичева", "Съветник", "БСП за България", src),
                c(eik, "Анета Пашалиева", "Съветник", "МК „Новото време“", src),
                c(eik, "Пантелей Мемцов", "Съветник", "Левицата!", src),
                c(eik, "Аргир Стоянов Вълчев", "Съветник", "ГЕРБ", src),
                c(eik, "Георги Генов Дзанев", "Съветник", "ГЕРБ", src),
                c(eik, "Асен Андреев Андреев", "Съветник", "ГЕРБ", src),
                c(eik, "Теодора Раднева Шилитева", "Съветник", "ГЕРБ", src),
                c(eik, "Виктория Емилова Манова", "Съветник", "ГЕРБ", src),
                c(eik, "Станчо Тонев Денев", "Съветник", "ГЕРБ", src),
                c(eik, "д-р Лилия Милина", "Съветник", "ПП-ДБ", src),
                c(eik, "Веселин Мицев", "Съветник", "ПП-ДБ", src));
    }

    private static List<SeedCouncilor> banite() {
        String eik = MonitorRegionalConfig.BANITE_EIK;
        String src = "https://banite.egov.bg/wps/portal/banite/municipal-council/permanent.commissions";
        String mayorSrc = "https://banite.egov.bg/wps/portal/banite/home";
        return List.of(
                c(eik, "Павлин Белчев", "Кмет на община", "ГЕРБ", mayorSrc),
                c(eik, "Диана Фиданова", "Председател на ОбС", null, src),
                c(eik, "Славей Босилков Кьоров", "Съветник", null, src),
                c(eik, "Павел Фиданов Солаков", "Съветник", null, src),
                c(eik, "Севдалин Бойков Хъшинов", "Съветник", null, src),
                c(eik, "Атанас Митков Кандуров", "Съветник", null, src),
                c(eik, "Димитър Мирчев Дончев", "Съветник", null, src),
                c(eik, "Боряна Станиславова Карамфилова", "Съветник", null, src),
                c(eik, "Кирчо Тасев Топчиев", "Съветник", null, src),
                c(eik, "Венета Минчева Баръмова", "Съветник", null, src),
                c(eik, "Стоянка Вихърова Чонева", "Съветник", null, src),
                c(eik, "Здравко Сашев Мирчев", "Съветник", null, src));
    }

    private static SeedCouncilor c(String eik, String name, String role, String party, String sourceUrl) {
        return new SeedCouncilor(eik, name, role, party, sourceUrl);
    }
}
