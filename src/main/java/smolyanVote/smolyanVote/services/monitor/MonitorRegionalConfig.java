package smolyanVote.smolyanVote.services.monitor;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Regional scope for Граждански монитор — област Смолян only.
 * EIK codes verified against sigma.midt.bg (2026-07).
 */
public final class MonitorRegionalConfig {

    public static final String SMOLYAN_CITY_EIK = "000615118";
    public static final String DEVIN_EIK = "000614895";
    public static final String ZLATOGRAD_EIK = "000614938";
    public static final String MADAN_EIK = "000614984";
    public static final String CHEPELARE_EIK = "000615164";
    public static final String RUDOZEM_EIK = "000615075";
    public static final String NEDELINO_EIK = "000615043";
    public static final String BANITE_EIK = "000614952";

    public static final String SIGMA_BASE_URL = "https://sigma.midt.bg";
    public static final String SIGMA_CONTRACTS_CSV = SIGMA_BASE_URL + "/contracts.csv";

    /** EIK whitelist — municipalities in oblast Smolyan (verified in SIGMA). */
    public static final Set<String> OBLAST_SMOLYAN_EIKS = Set.of(
            SMOLYAN_CITY_EIK,
            DEVIN_EIK,
            ZLATOGRAD_EIK,
            MADAN_EIK,
            CHEPELARE_EIK,
            RUDOZEM_EIK,
            NEDELINO_EIK,
            BANITE_EIK);

    /** Display names for regional comparison and charts. */
    public static final Map<String, String> AUTHORITY_LABELS = new LinkedHashMap<>();

    static {
        AUTHORITY_LABELS.put(SMOLYAN_CITY_EIK, "Община Смолян");
        AUTHORITY_LABELS.put(DEVIN_EIK, "Община Девин");
        AUTHORITY_LABELS.put(ZLATOGRAD_EIK, "Община Златоград");
        AUTHORITY_LABELS.put(MADAN_EIK, "Община Мадан");
        AUTHORITY_LABELS.put(CHEPELARE_EIK, "Община Чепеларе");
        AUTHORITY_LABELS.put(RUDOZEM_EIK, "Община Рудозем");
        AUTHORITY_LABELS.put(NEDELINO_EIK, "Община Неделино");
        AUTHORITY_LABELS.put(BANITE_EIK, "Община Баните");
    }

    private MonitorRegionalConfig() {
    }

    public static boolean isRegionalAuthority(String eik) {
        if (eik == null || eik.isBlank()) {
            return false;
        }
        return OBLAST_SMOLYAN_EIKS.contains(eik.trim());
    }

    public static String labelForAuthority(String eik, String fallbackName) {
        if (eik != null && AUTHORITY_LABELS.containsKey(eik.trim())) {
            return AUTHORITY_LABELS.get(eik.trim());
        }
        return fallbackName != null && !fallbackName.isBlank() ? fallbackName : eik;
    }
}
