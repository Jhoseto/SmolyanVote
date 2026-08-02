package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import smolyanVote.smolyanVote.models.monitor.MonitorOfficialBudgetEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorOfficialBudgetLineEntity;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCitizenAssessmentDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

/** Static ObS budget figures for Община Смолян (2021–2026) — not updated by importers. */
public final class MonitorOfficialBudgetSeed {

    public static final int FIRST_YEAR = 2021;
    public static final int LAST_YEAR = 2026;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private MonitorOfficialBudgetSeed() {
    }

    public static Optional<MonitorOfficialBudgetEntity> build(int year) {
        return switch (year) {
            case 2021 -> Optional.of(build2021());
            case 2022 -> Optional.of(build2022());
            case 2023 -> Optional.of(build2023());
            case 2024 -> Optional.of(build2024());
            case 2025 -> Optional.of(build2025());
            case 2026 -> Optional.of(build2026());
            default -> Optional.empty();
        };
    }

    private static MonitorOfficialBudgetEntity base(int year) {
        MonitorOfficialBudgetEntity entity = new MonitorOfficialBudgetEntity();
        entity.setAuthorityEik(MonitorRegionalConfig.SMOLYAN_CITY_EIK);
        entity.setBudgetYear(year);
        return entity;
    }

    private static MonitorOfficialBudgetEntity build2021() {
        MonitorOfficialBudgetEntity entity = base(2021);
        entity.setAdoptedTotalBgn(bgn("53132557.00"));
        entity.setExecutedTotalBgn(null);
        entity.setSourceUrl("https://www.smolyan.bg");
        entity.setSourceTitle("Решение №438, 25.02.2021 — бюджет 2021 г.");
        entity.setNotes("Приет бюджет по решение на ОбС. Изпълнението за 2021 — потвърждаване от годишен отчет.");
        entity.setCitizenAssessmentJson(assessmentJson(new MonitorCitizenAssessmentDTO(
                "Бюджет 2021 — базова година след COVID",
                "mixed",
                java.util.List.of("Приет балансиран бюджет 53,1 млн. лв."),
                java.util.List.of("Липсва публикувано годишно усвоение в seed данните"),
                "Планирани разходи за услуги и инвестиции — следете дали са усвоени в следващите отчети.")));
        addLine(entity, "delegated", "Делегирани от държавата дейности", "29345300.00", null, 0);
        addLine(entity, "local", "Местни дейности", "23787257.00", null, 1);
        return entity;
    }

    private static MonitorOfficialBudgetEntity build2022() {
        MonitorOfficialBudgetEntity entity = base(2022);
        entity.setAdoptedTotalBgn(bgn("64690162.00"));
        entity.setExecutedTotalBgn(bgn("60438126.00"));
        entity.setExecutionAsOf(LocalDate.of(2022, 12, 31));
        entity.setSourceUrl("https://www.smolyan.bg");
        entity.setSourceTitle("Годишен финансов отчет 31.12.2022");
        entity.setNotes("Без нов дълг през 2022 г.");
        entity.setCitizenAssessmentJson(assessmentJson(new MonitorCitizenAssessmentDTO(
                "93% усвоение — без нов дълг",
                "positive",
                java.util.List.of(
                        "Без нов дълг през 2022 г.",
                        "Около 93% усвоение на приетия бюджет"),
                java.util.List.of("Около 6% от планираните средства не са усвоени"),
                "Управлението държи разходите в рамките на приходите — положителен сигнал за стабилност.")));
        addLine(entity, "delegated", "Делегирани от държавата дейности", "34193919.00", null, 0);
        addLine(entity, "local", "Местни дейности", "30496243.00", null, 1);
        return entity;
    }

    private static MonitorOfficialBudgetEntity build2023() {
        MonitorOfficialBudgetEntity entity = base(2023);
        entity.setAdoptedTotalBgn(bgn("74929647.00"));
        entity.setExecutedTotalBgn(bgn("67971000.00"));
        entity.setExecutionAsOf(LocalDate.of(2023, 12, 31));
        entity.setSourceUrl("https://www.smolyan.bg");
        entity.setSourceTitle("ObS авг. 2023; годишен отчет 2023");
        entity.setNotes("Бюджетът беше приет с ~4 месеца закъснение; без повишение на местни данъци.");
        entity.setCitizenAssessmentJson(assessmentJson(new MonitorCitizenAssessmentDTO(
                "Стабилно усвоение без нови данъци",
                "positive",
                java.util.List.of(
                        "Спазени задължения по чл. 130 ЗПФ",
                        "Без повишение на местни данъци"),
                java.util.List.of("Бюджетът беше приет с около 4 месеца закъснение"),
                "Средствата са усвоени в голяма част — важно е закъснението при приемането да не се повтаря.")));
        addLine(entity, "delegated", "Делегирани от държавата дейности", "43353186.00", null, 0);
        addLine(entity, "local", "Местни дейности", "31576461.00", null, 1);
        return entity;
    }

    private static MonitorOfficialBudgetEntity build2024() {
        MonitorOfficialBudgetEntity entity = base(2024);
        entity.setAdoptedTotalBgn(bgn("81146826.00"));
        entity.setExecutedTotalBgn(bgn("88206518.00"));
        entity.setExecutionAsOf(LocalDate.of(2024, 12, 31));
        entity.setSourceUrl("https://www.smolyan.bg");
        entity.setSourceTitle("ObS 09.02.2024; годишен отчет 31.12.2024");
        entity.setNotes("Рекорден план (образование ~27M лв.); изпълнение 109% — продажби на активи ~8% от приходите.");
        entity.setCitizenAssessmentJson(assessmentJson(new MonitorCitizenAssessmentDTO(
                "109% изпълнение — смесен сигнал",
                "mixed",
                java.util.List.of(
                        "+750K лв. над планираните местни приходи",
                        "Одит без съществени забележки"),
                java.util.List.of(
                        "Изпълнение над 100% — частично от продажба на активи (~8%)",
                        "ОбС заседава на 16/11 — закъснение на ключови решения"),
                "Прекалено високото усвоение не винаги е „успех“ — проверете дали идва от устойчиви приходи или еднократни продажби.")));
        addLine(entity, "delegated", "Делегирани от държавата дейности", "49329500.00", null, 0);
        addLine(entity, "local", "Местни дейности", "31817326.00", null, 1);
        return entity;
    }

    private static MonitorOfficialBudgetEntity build2025() {
        MonitorOfficialBudgetEntity entity = base(2025);
        entity.setAdoptedTotalBgn(bgn("137284489.00"));
        entity.setExecutedTotalBgn(null);
        entity.setSourceUrl("https://www.smolyan.bg");
        entity.setSourceTitle("Решение на Общински съвет — бюджет 2025 г.");
        entity.setNotes("Приет бюджет 137 284 489 лв. (дек. 2024). Капиталова програма ~50M лв. Усвоението ще се актуализира от Admin след годишен отчет.");
        entity.setCitizenAssessmentJson(assessmentJson(new MonitorCitizenAssessmentDTO(
                "Амбициозен план — изчаква се отчет",
                "pending",
                java.util.List.of("Капиталова програма ~50 млн. лв. за инвестиции"),
                java.util.List.of("Няма публикуван годишен отчет за 2025 още"),
                "Голяма част от бюджета е за капиталови проекти — следете дали ще бъдат реално изпълнени до края на годината.")));
        addLine(entity, "delegated", "Делегирани от държавата дейности", "57120183.00", null, 0);
        addLine(entity, "local", "Местни дейности (разходи)", "80164306.00", null, 1);
        addLine(entity, "capital", "Капиталови разходи (програма)", "55388800.00", null, 2);
        addLine(entity, "investment_program", "От тях: инвестиционна програма", "50000000.00", null, 3);
        return entity;
    }

    /**
     * 2026 — бюджетът не е приет от ObS (авг. 2026); показваме само статус и временни правила.
     * Проект obюджет ~43,7 млн. € е споменат в медиите, но не се записва като приет.
     */
    private static MonitorOfficialBudgetEntity build2026() {
        MonitorOfficialBudgetEntity entity = base(2026);
        entity.setAdoptedTotalBgn(null);
        entity.setExecutedTotalBgn(null);
        entity.setSourceUrl("https://www.smolyan.bg");
        entity.setSourceTitle("Временни финансови правила до приемане на бюджет 2026 г.");
        entity.setNotes(
                "Към август 2026 г. Общинският съвет не е приел окончателен бюджет за 2026. "
                        + "Действат временни правила по чл. 98 ЗПФ — разходите са ограничени до нивото "
                        + "на същия период на 2025 г. Проект obюджет ~43,7 млн. € не е приет и "
                        + "не се показва като официална сума.");
        entity.setCitizenAssessmentJson(assessmentJson(new MonitorCitizenAssessmentDTO(
                "Няма приет бюджет — временни правила",
                "pending",
                java.util.List.of(
                        "Временни лимити гарантират заплати и неотложни разходи",
                        "Публично обсъждане на правилата — февр. 2026"),
                java.util.List.of(
                        "Окончателен бюджет не е гласуван",
                        "Капиталовата програма е неясна до решение на ОбС"),
                "Следете решенията на ОбС — до приемане на бюджет всички сравнения с 2025 са с ограничена стойност.")));
        return entity;
    }

    private static BigDecimal bgn(String value) {
        return new BigDecimal(value);
    }

    private static void addLine(
            MonitorOfficialBudgetEntity entity,
            String key,
            String label,
            String adopted,
            String executed,
            int order) {
        MonitorOfficialBudgetLineEntity line = new MonitorOfficialBudgetLineEntity();
        line.setCategoryKey(key);
        line.setLabel(label);
        line.setAdoptedBgn(new BigDecimal(adopted));
        line.setExecutedBgn(executed != null ? new BigDecimal(executed) : null);
        line.setSortOrder(order);
        entity.addLine(line);
    }

    private static String assessmentJson(MonitorCitizenAssessmentDTO assessment) {
        try {
            return MAPPER.writeValueAsString(assessment);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize citizen assessment", ex);
        }
    }
}
