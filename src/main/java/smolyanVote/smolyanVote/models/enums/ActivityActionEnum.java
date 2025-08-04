package smolyanVote.smolyanVote.models.enums;

/**
 * Enum за всички типове действия които се логват в системата
 * Използва се за стандартизиране на activity logging
 */
public enum ActivityActionEnum {

    // ===== СЪЗДАВАНЕ НА СЪДЪРЖАНИЕ =====
    CREATE_PUBLICATION("Създаде публикация", "create"),
    CREATE_SIMPLE_EVENT("Създаде събитие", "create"),
    CREATE_REFERENDUM("Създаде референдум", "create"),
    CREATE_MULTI_POLL("Създаде анкета", "create"),
    CREATE_COMMENT("Коментира", "create"),
    CREATE_SIGNAL("Създаде сигнал", "create"),

    // ===== ВЗАИМОДЕЙСТВИЯ =====
    LIKE_PUBLICATION("Хареса публикация", "interact"),
    DISLIKE_PUBLICATION("Не хареса публикация", "interact"),
    LIKE_COMMENT("Хареса коментар", "interact"),
    DISLIKE_COMMENT("Не хареса коментар", "interact"),

    VOTE_SIMPLE_EVENT("Гласува в събитие", "interact"),
    VOTE_REFERENDUM("Гласува в референдум", "interact"),
    VOTE_MULTI_POLL("Гласува в анкета", "interact"),

    SHARE_PUBLICATION("Сподели публикация", "interact"),
    SHARE_EVENT("Сподели събитие", "interact"),
    SHARE_REFERENDUM("Сподели референдум", "interact"),

    BOOKMARK_CONTENT("Добави в отметки", "interact"),
    FOLLOW_USER("Последва потребител", "interact"),
    UNFOLLOW_USER("Спря да следва потребител", "interact"),

    // ===== ПРЕГЛЕЖДАНЕ =====
    VIEW_PUBLICATION("Прегледа публикация", "view"),
    VIEW_EVENT("Прегледа събитие", "view"),
    VIEW_REFERENDUM("Прегледа референдум", "view"),
    VIEW_MULTI_POLL("Прегледа множествена анкета", "view"),
    VIEW_SIGNAL("Прегледа сигнал", "view"),
    VIEW_PROFILE("Прегледа профил", "view"),

    SEARCH_CONTENT("Търсене в съдържанието", "other"),
    FILTER_CONTENT("Филтриране на съдържание", "other"),

    // ===== РЕДАКТИРАНЕ =====
    EDIT_PUBLICATION("Редактира публикация", "moderate"),
    EDIT_EVENT("Редактира събитие", "moderate"),
    EDIT_REFERENDUM("Редактира референдум", "moderate"),
    EDIT_MULTI_POLL("Редактира множествена анкета", "moderate"),
    EDIT_SIGNAL("Редактира сигнал", "moderate"),
    EDIT_COMMENT("Редактира коментар", "moderate"),
    EDIT_PROFILE("Редактира профил", "other"),

    // ===== ИЗТРИВАНЕ =====
    DELETE_PUBLICATION("Изтри публикация", "moderate"),
    DELETE_EVENT("Изтри събитие", "moderate"),
    DELETE_REFERENDUM("Изтри референдум", "moderate"),
    DELETE_COMMENT("Изтри коментар", "moderate"),
    DELETE_SIGNAL("Изтри сигнал", "moderate"),

    // ===== ДОКЛАДВАНЕ =====
    REPORT_PUBLICATION("Докладва публикация", "moderate"),
    REPORT_EVENT("Докладва събитие", "moderate"),
    REPORT_REFERENDUM("Докладва референдум", "moderate"),
    REPORT_COMMENT("Докладва коментар", "moderate"),
    REPORT_USER("Докладва потребител", "moderate"),

    // ===== АДМИНИСТРАЦИЯ =====
    ADMIN_REVIEW_REPORT("Прегледа доклад", "moderate"),
    ADMIN_DELETE_CONTENT("Изтри съдържание (админ)", "moderate"),
    ADMIN_BAN_USER("Блокира потребител", "moderate"),
    ADMIN_UNBAN_USER("Отблокира потребител", "moderate"),
    ADMIN_PROMOTE_USER("Повиши потребител", "moderate"),
    ADMIN_DEMOTE_USER("Понижи потребител", "moderate"),
    CONTACT_MESSAGE("Съобщение до контакт", "moderate"),

    // ===== АВТЕНТИКАЦИЯ =====
    USER_REGISTER("Регистрация", "auth"),
    USER_LOGIN("Вход в системата", "auth"),
    USER_LOGOUT("Изход от системата", "auth"),
    USER_PASSWORD_CHANGE("Смяна на парола", "auth"),
    USER_EMAIL_VERIFY("Потвърждение на имейл", "auth"),
    USER_PASSWORD_RESET("Нулиране на парола", "auth"),

    // ===== НАСТРОЙКИ =====
    UPDATE_NOTIFICATIONS("Актуализира нотификации", "other"),
    UPDATE_PRIVACY("Актуализира поверителност", "other"),
    EXPORT_DATA("Експортира данни", "other"),
    DELETE_ACCOUNT("Изтриване на акаунт", "other"),

    // ===== СИСТЕМА =====
    SYSTEM_BACKUP("Системен backup", "other"),
    SYSTEM_MAINTENANCE("Системна поддръжка", "other"),
    API_ACCESS("API достъп", "other");

    private final String displayName;
    private final String category;

    ActivityActionEnum(String displayName, String category) {
        this.displayName = displayName;
        this.category = category;
    }

    /**
     * Връща човешки четимо име на действието
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Връща категорията на действието за UI филтриране
     * Възможни стойности: "create", "interact", "moderate", "auth", "other"
     */
    public String getCategory() {
        return category;
    }

    /**
     * Връща enum стойността като string за записване в базата
     */
    public String getActionName() {
        return this.name();
    }

    /**
     * Парсира string към ActivityActionEnum enum
     * @param actionName string представяне на действието
     * @return ActivityActionEnum или null ако не е намерено
     */
    public static ActivityActionEnum fromString(String actionName) {
        if (actionName == null || actionName.trim().isEmpty()) {
            return null;
        }

        try {
            return ActivityActionEnum.valueOf(actionName.toUpperCase());
        } catch (IllegalArgumentException e) {
            System.err.println("Unknown activity action: " + actionName);
            return null;
        }
    }

    /**
     * Проверява дали действието е от определена категория
     */
    public boolean isCategory(String category) {
        return this.category.equals(category);
    }

    /**
     * Връща всички действия от определена категория
     */
    public static ActivityActionEnum[] getByCategory(String category) {
        return java.util.Arrays.stream(ActivityActionEnum.values())
                .filter(action -> action.getCategory().equals(category))
                .toArray(ActivityActionEnum[]::new);
    }

    @Override
    public String toString() {
        return displayName;
    }

    // ===== HELPER МЕТОДИ ЗА ГЛАСУВАНИЯ =====

    /**
     * Създава детайли за гласуване в простo събитие
     */
    public static String createSimpleEventVoteDetails(String voteChoice) {
        return "Гласува: " + voteChoice;
    }

    /**
     * Създава детайли за гласуване в референдум
     */
    public static String createReferendumVoteDetails(String selectedOption) {
        return "Избра опция: '" + selectedOption + "'";
    }

    /**
     * Създава детайли за гласуване в анкета с множествен избор
     */
    public static String createMultiPollVoteDetails(java.util.List<String> selectedOptions) {
        if (selectedOptions == null || selectedOptions.isEmpty()) {
            return "Гласува без избрани опции";
        }
        String optionsText = String.join("', '", selectedOptions);
        return "Избра опции: '" + optionsText + "'";
    }

    /**
     * Създава детайли за харесване/нехаресване
     */
    public static String createLikeDetails(boolean isLike) {
        return isLike ? "Хареса съдържанието" : "Не хареса съдържанието";
    }

    /**
     * Създава детайли за създаване на съдържание
     */
    public static String createContentDetails(String title, String category) {
        if (title != null && category != null) {
            return "Заглавие: '" + title + "', Категория: " + category;
        } else if (title != null) {
            return "Заглавие: '" + title + "'";
        } else if (category != null) {
            return "Категория: " + category;
        }
        return "Създаде ново съдържание";
    }


}