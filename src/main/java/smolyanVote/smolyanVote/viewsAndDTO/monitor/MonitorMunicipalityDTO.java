package smolyanVote.smolyanVote.viewsAndDTO.monitor;

/**
 * One option of the municipality filter above the monitor tabs.
 *
 * @param eik                 authority EIK used to scope every request
 * @param name                display label, e.g. "Община Смолян"
 * @param hasScrapedDocuments whether council decisions, consultations and deadlines are
 *                            collected for it — currently only Смолян has a scraped source
 */
public record MonitorMunicipalityDTO(
        String eik,
        String name,
        boolean hasScrapedDocuments
) {
}
