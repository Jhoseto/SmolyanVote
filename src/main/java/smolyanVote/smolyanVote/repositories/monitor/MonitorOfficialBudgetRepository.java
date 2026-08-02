package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorOfficialBudgetEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitorOfficialBudgetRepository extends JpaRepository<MonitorOfficialBudgetEntity, Long> {

    Optional<MonitorOfficialBudgetEntity> findByAuthorityEikAndBudgetYear(String authorityEik, int budgetYear);

    List<MonitorOfficialBudgetEntity> findByAuthorityEikOrderByBudgetYearDesc(String authorityEik);
}
