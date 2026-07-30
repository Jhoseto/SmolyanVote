package smolyanVote.smolyanVote.services.monitor;

import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

/**
 * The municipality the public monitor is narrowed to, or the whole oblast.
 *
 * <p>Contracts carry an authority EIK, so procurement, risk, flows and EU funds can be
 * scoped per municipality. The scraped paperwork (council decisions, consultations,
 * deadlines) is pulled from smolyan.bg alone, so it exists for Община Смолян only —
 * {@link #includesScrapedSources()} keeps the other municipalities from being shown
 * Smolyan's documents as if they were their own.
 */
public record MonitorScope(String authorityEik) {

    public static final MonitorScope WHOLE_OBLAST = new MonitorScope(null);

    /**
     * Unknown values fall back to the whole oblast on purpose: this parameter travels in
     * shareable URLs, where a hand-edited or stale EIK should widen the view rather than
     * turn the page into an error.
     */
    public static MonitorScope of(String rawEik) {
        if (rawEik == null || rawEik.isBlank()) {
            return WHOLE_OBLAST;
        }
        String eik = rawEik.trim();
        return MonitorRegionalConfig.isRegionalAuthority(eik) ? new MonitorScope(eik) : WHOLE_OBLAST;
    }

    public boolean isWholeOblast() {
        return authorityEik == null;
    }

    /** Null for the whole oblast, which the JPQL queries read as "no filter". */
    public String authorityFilter() {
        return authorityEik;
    }

    public boolean includesScrapedSources() {
        return isWholeOblast() || MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(authorityEik);
    }

    /**
     * Whose executed spend the budget page compares against the plan. Planned lines are
     * maintained for Смолян, so the oblast view keeps that baseline instead of summing
     * eight municipalities against one municipality's plan.
     */
    public String budgetAuthorityEik() {
        return isWholeOblast() ? MonitorRegionalConfig.SMOLYAN_CITY_EIK : authorityEik;
    }

    public boolean matches(MonitorContractEntity contract) {
        return isWholeOblast() || (contract != null && authorityEik.equals(contract.getAuthorityEik()));
    }

    public String label() {
        return isWholeOblast()
                ? "Област Смолян"
                : MonitorRegionalConfig.labelForAuthority(authorityEik, authorityEik);
    }
}
