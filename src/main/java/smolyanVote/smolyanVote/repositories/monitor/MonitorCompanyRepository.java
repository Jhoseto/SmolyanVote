package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitorCompanyRepository extends JpaRepository<MonitorCompanyEntity, Long> {

    Optional<MonitorCompanyEntity> findByEik(String eik);

    @Query("SELECT c FROM MonitorCompanyEntity c WHERE c.registryFetchedAt IS NULL OR c.legalForm IS NULL ORDER BY c.totalWonEur DESC")
    List<MonitorCompanyEntity> findNeedingRegistryEnrichment(Pageable pageable);

    @Query("SELECT c FROM MonitorCompanyEntity c WHERE " +
            "(:search IS NULL OR :search = '' OR " +
            " LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(c.eik) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY c.totalWonEur DESC")
    Page<MonitorCompanyEntity> search(@Param("search") String search, Pageable pageable);
}
