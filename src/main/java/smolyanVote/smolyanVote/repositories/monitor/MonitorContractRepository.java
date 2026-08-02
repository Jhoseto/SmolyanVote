package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MonitorContractRepository extends JpaRepository<MonitorContractEntity, Long> {

    List<MonitorContractEntity> findBySignedAtIsNull();

    long countBySignedAtIsNull();

    long countByOriginalCurrencyIsNull();

    long countByCurrencyWarningIsNotNull();

    long countBySigmaIdStartingWith(String prefix);

    List<MonitorContractEntity> findByOriginalCurrencyIsNull();

    @Query("SELECT c FROM MonitorContractEntity c WHERE c.sigmaId NOT LIKE 'eop:%' "
            + "AND c.amountEur IS NOT NULL ORDER BY c.signedAt DESC")
    List<MonitorContractEntity> findSigmaContractsWithAmount(Pageable pageable);

    Optional<MonitorContractEntity> findBySigmaId(String sigmaId);

    Optional<MonitorContractEntity> findFirstByUnp(String unp);

    /** Loaded in one shot by the SIGMA import so re-imports do not issue a query per row. */
    List<MonitorContractEntity> findAllByAuthorityEik(String authorityEik);

    /**
     * All contracts of one municipality, or of the whole oblast when {@code authorityEik}
     * is null — the public monitor can be narrowed with a municipality filter.
     */
    @Query("SELECT c FROM MonitorContractEntity c WHERE (:authorityEik IS NULL OR c.authorityEik = :authorityEik)")
    List<MonitorContractEntity> findAllInScope(@Param("authorityEik") String authorityEik);

    @Query("SELECT c FROM MonitorContractEntity c WHERE (:authorityEik IS NULL OR c.authorityEik = :authorityEik)")
    Page<MonitorContractEntity> findAllInScope(@Param("authorityEik") String authorityEik, Pageable pageable);

    @Query("SELECT COUNT(c) FROM MonitorContractEntity c WHERE (:authorityEik IS NULL OR c.authorityEik = :authorityEik)")
    long countInScope(@Param("authorityEik") String authorityEik);

    @Query("SELECT c FROM MonitorContractEntity c WHERE c.riskScore IS NOT NULL AND c.riskScore >= :minScore "
            + "AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik) "
            + "ORDER BY c.riskScore DESC, c.signedAt DESC")
    Page<MonitorContractEntity> findAnomalies(@Param("minScore") int minScore,
                                              @Param("authorityEik") String authorityEik,
                                              Pageable pageable);

    @Query("SELECT COUNT(c) FROM MonitorContractEntity c WHERE c.riskScore IS NOT NULL AND c.riskScore >= :minScore "
            + "AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik)")
    long countAnomalies(@Param("minScore") int minScore, @Param("authorityEik") String authorityEik);

    @Query("SELECT COALESCE(SUM(c.amountEur), 0) FROM MonitorContractEntity c WHERE c.amountEur IS NOT NULL "
            + "AND c.signedAt >= :from AND c.signedAt <= :to "
            + "AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik)")
    BigDecimal sumAmountBetween(@Param("from") LocalDate from,
                                @Param("to") LocalDate to,
                                @Param("authorityEik") String authorityEik);

    long countBySignedAtGreaterThanEqual(LocalDate from);

    @Query("SELECT MAX(c.fetchedAt) FROM MonitorContractEntity c")
    java.time.Instant findLatestFetchedAt();

    List<MonitorContractEntity> findByContractorEikAndSectorCode(String contractorEik, String sectorCode);

    @Query("SELECT c FROM MonitorContractEntity c WHERE c.sectorCode = :sectorCode AND c.amountEur IS NOT NULL")
    List<MonitorContractEntity> findBySectorWithAmount(@Param("sectorCode") String sectorCode);

    @Query("SELECT c.contractorEik, c.contractorName, COALESCE(SUM(c.amountEur), 0), COUNT(c) FROM MonitorContractEntity c "
            + "WHERE c.amountEur IS NOT NULL AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik) "
            + "GROUP BY c.contractorEik, c.contractorName ORDER BY SUM(c.amountEur) DESC")
    List<Object[]> topContractors(@Param("authorityEik") String authorityEik, Pageable pageable);

    @Query("SELECT YEAR(c.signedAt), MONTH(c.signedAt), COALESCE(SUM(c.amountEur), 0), COUNT(c) FROM MonitorContractEntity c "
            + "WHERE c.signedAt IS NOT NULL AND c.amountEur IS NOT NULL "
            + "AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik) "
            + "GROUP BY YEAR(c.signedAt), MONTH(c.signedAt) ORDER BY YEAR(c.signedAt), MONTH(c.signedAt)")
    List<Object[]> monthlySpend(@Param("authorityEik") String authorityEik);

    @Query("SELECT c.sectorCode, COALESCE(SUM(c.amountEur), 0), COUNT(c) FROM MonitorContractEntity c "
            + "WHERE c.amountEur IS NOT NULL AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik) "
            + "GROUP BY c.sectorCode ORDER BY SUM(c.amountEur) DESC")
    List<Object[]> spendBySector(@Param("authorityEik") String authorityEik);

    @Query("SELECT c FROM MonitorContractEntity c WHERE " +
            "(:search IS NULL OR :search = '' OR " +
            " LOWER(c.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(c.contractorName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik) " +
            "ORDER BY c.signedAt DESC")
    Page<MonitorContractEntity> search(@Param("search") String search,
                                       @Param("authorityEik") String authorityEik,
                                       Pageable pageable);

    List<MonitorContractEntity> findByContractorEikOrderBySignedAtDesc(String contractorEik, Pageable pageable);

    List<MonitorContractEntity> findBySubcontractorEikOrderBySignedAtDesc(String subcontractorEik, Pageable pageable);

    @Query("SELECT COUNT(c) FROM MonitorContractEntity c WHERE c.subcontractorEik = :eik")
    long countBySubcontractorEik(@Param("eik") String eik);

    @Query("SELECT COALESCE(SUM(c.subcontractingAmountEur), 0) FROM MonitorContractEntity c "
            + "WHERE c.subcontractorEik = :eik AND c.subcontractingAmountEur IS NOT NULL")
    BigDecimal sumSubcontractingAmountBySubcontractorEik(@Param("eik") String eik);

    @Query("SELECT c FROM MonitorContractEntity c WHERE c.bidsReceived IS NOT NULL "
            + "AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik)")
    List<MonitorContractEntity> findAllWithBids(@Param("authorityEik") String authorityEik);

    @Query("SELECT COUNT(c) FROM MonitorContractEntity c WHERE c.contractorEik = :eik AND c.sectorCode = :sector "
            + "AND c.signedAt >= :since AND c.amountEur IS NOT NULL AND c.amountEur < :threshold")
    long countFragmentationCandidates(
            @Param("eik") String eik,
            @Param("sector") String sector,
            @Param("since") LocalDate since,
            @Param("threshold") BigDecimal threshold);

    @Query("SELECT YEAR(c.signedAt), COALESCE(SUM(c.amountEur), 0), COUNT(c) FROM MonitorContractEntity c "
            + "WHERE c.signedAt IS NOT NULL AND c.amountEur IS NOT NULL "
            + "AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik) "
            + "GROUP BY YEAR(c.signedAt) ORDER BY YEAR(c.signedAt)")
    List<Object[]> yearlySpend(@Param("authorityEik") String authorityEik);

    @Query("SELECT c.authorityEik, MAX(c.authorityName), COALESCE(SUM(c.amountEur), 0), COUNT(c) " +
            "FROM MonitorContractEntity c WHERE c.amountEur IS NOT NULL GROUP BY c.authorityEik " +
            "ORDER BY SUM(c.amountEur) DESC")
    List<Object[]> spendByAuthority();

    @Query("SELECT COUNT(c) FROM MonitorContractEntity c WHERE c.authorityEik = :eik AND c.bidsReceived = 1")
    long countSingleBidderByAuthority(@Param("eik") String eik);

    @Query("SELECT COUNT(c) FROM MonitorContractEntity c WHERE c.authorityEik = :eik AND c.bidsReceived IS NOT NULL")
    long countWithBidsByAuthority(@Param("eik") String eik);

    @Query("SELECT COALESCE(SUM(c.amountEur), 0) FROM MonitorContractEntity c WHERE c.riskScore IS NOT NULL "
            + "AND c.riskScore >= :minScore AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik)")
    BigDecimal sumFlaggedAmount(@Param("minScore") int minScore, @Param("authorityEik") String authorityEik);

    @Query("SELECT DISTINCT YEAR(c.signedAt) FROM MonitorContractEntity c "
            + "WHERE c.signedAt IS NOT NULL AND c.amountEur IS NOT NULL "
            + "AND (:authorityEik IS NULL OR c.authorityEik = :authorityEik) "
            + "ORDER BY YEAR(c.signedAt) DESC")
    List<Integer> findYearsWithSpend(@Param("authorityEik") String authorityEik);

    @Query("SELECT COUNT(c) FROM MonitorContractEntity c WHERE "
            + "c.riskScore IS NOT NULL AND c.riskScore >= :minRisk "
            + "AND (c.aiAnalysis IS NULL OR c.aiAnalysis = '')")
    long countPendingContractAiProcessing(@Param("minRisk") int minRisk);

    @Query("SELECT c FROM MonitorContractEntity c WHERE "
            + "c.riskScore IS NOT NULL AND c.riskScore >= :minRisk "
            + "AND (c.aiAnalysis IS NULL OR c.aiAnalysis = '') "
            + "ORDER BY c.riskScore DESC, c.signedAt DESC")
    List<MonitorContractEntity> findPendingContractAiProcessing(
            @Param("minRisk") int minRisk, Pageable pageable);
}
