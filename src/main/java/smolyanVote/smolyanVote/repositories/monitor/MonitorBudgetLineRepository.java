package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorBudgetLineEntity;

import java.util.List;

@Repository
public interface MonitorBudgetLineRepository extends JpaRepository<MonitorBudgetLineEntity, Long> {

    List<MonitorBudgetLineEntity> findByBudgetYearOrderBySortOrderAsc(int budgetYear);

    long countByBudgetYear(int budgetYear);
}
