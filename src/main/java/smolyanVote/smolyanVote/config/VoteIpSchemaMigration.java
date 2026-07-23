package smolyanVote.smolyanVote.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Polymorphic columns ({@code event_id}/{@code entity_id} + type) must not FK a single entity table.
 * Legacy schemas incorrectly referenced only {@code simple_events}, breaking referendum/multipoll votes.
 */
@Component
public class VoteIpSchemaMigration {

    private static final Logger log = LoggerFactory.getLogger(VoteIpSchemaMigration.class);

    private static final List<String> POLYMORPHIC_TABLES = List.of(
            "vote_ips",
            "activity_logs",
            "notifications",
            "reports"
    );

    private static final List<String> POLYMORPHIC_COLUMNS = List.of("event_id", "entity_id");

    private final JdbcTemplate jdbcTemplate;

    public VoteIpSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void dropObsoletePolymorphicForeignKeys() {
        try {
            for (String table : POLYMORPHIC_TABLES) {
                for (String column : POLYMORPHIC_COLUMNS) {
                    dropForeignKeys(table, column);
                }
            }
        } catch (Exception ex) {
            log.warn("Polymorphic FK migration skipped: {}", ex.getMessage());
        }
    }

    private void dropForeignKeys(String tableName, String columnName) {
        List<Map<String, Object>> constraints = jdbcTemplate.queryForList(
                """
                SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                """,
                tableName,
                columnName);

        for (Map<String, Object> row : constraints) {
            String constraintName = String.valueOf(row.get("CONSTRAINT_NAME"));
            String referencedTable = String.valueOf(row.get("REFERENCED_TABLE_NAME"));
            jdbcTemplate.execute("ALTER TABLE `" + tableName + "` DROP FOREIGN KEY `" + constraintName + "`");
            log.info(
                    "Dropped obsolete FK {}.{} -> {} ({})",
                    tableName,
                    columnName,
                    referencedTable,
                    constraintName);
        }
    }
}
