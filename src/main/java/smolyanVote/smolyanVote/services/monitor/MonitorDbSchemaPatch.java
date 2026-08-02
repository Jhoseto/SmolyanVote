package smolyanVote.smolyanVote.services.monitor;

import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hibernate ddl-auto=update does not always relax NOT NULL on MySQL — run once so
 * 2026 budget (not yet adopted) can store null adopted_total_bgn.
 */
@Component
public class MonitorDbSchemaPatch {

    private static final Logger log = LoggerFactory.getLogger(MonitorDbSchemaPatch.class);

    private final EntityManager entityManager;

    public MonitorDbSchemaPatch(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(0)
    @Transactional
    public void relaxOfficialBudgetAdoptedColumn() {
        try {
            entityManager
                    .createNativeQuery(
                            "ALTER TABLE monitor_official_budgets MODIFY adopted_total_bgn DECIMAL(18,2) NULL")
                    .executeUpdate();
            log.debug("monitor_official_budgets.adopted_total_bgn allows NULL");
        } catch (Exception ex) {
            log.warn("Could not alter monitor_official_budgets.adopted_total_bgn: {}", ex.getMessage());
        }
    }
}
