package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.util.List;
import java.util.Map;

public interface ReportsService {

    // ===== ГЛАВЕН МЕТОД ЗА СЪЗДАВАНЕ НА ДОКЛАДИ =====

    /**
     * Създава доклад за конкретен entity (универсален метод за всички типове)
     */
    void createReport(ReportableEntityType entityType, Long entityId, UserEntity reporter,
                      String reasonString, String description);

    // ===== ПРОВЕРКИ =====

    /**
     * Проверява дали потребител може да докладва конкретен entity
     */
    boolean canUserReportEntity(ReportableEntityType entityType, Long entityId, UserEntity user);

    /**
     * Проверява дали потребител е докладвал конкретен entity
     */
    boolean hasUserReportedEntity(ReportableEntityType entityType, Long entityId, String username);

    /**
     * Rate limiting проверка
     */
    boolean hasUserExceededReportLimit(UserEntity user);

    // ===== ИЗВЛИЧАНЕ НА ДОКЛАДИ =====

    /**
     * Връща всички доклади за конкретен entity
     */
    List<ReportsEntity> getReportsForEntity(ReportableEntityType entityType, Long entityId);

    /**
     * Връща броя доклади за конкретен entity
     */
    long getReportsCountForEntity(ReportableEntityType entityType, Long entityId);

    // ===== АДМИН МЕТОДИ =====

    /**
     * Връща pending доклади за админи
     */
    Page<ReportsEntity> getPendingReports(Pageable pageable);

    /**
     * Прегледа доклад (админ операция)
     */
    void reviewReport(Long reportId, UserEntity admin, String status, String adminNotes);

    /**
     * Статистики за докладите
     */
    Map<String, Object> getReportsStatistics();

    // ===== ИЗТРИВАНЕ НА ДОКЛАДИ =====

    /**
     * Изтрива всички доклади за конкретен entity (използва се при изтриване на entity)
     */
    void deleteAllReportsForEntity(ReportableEntityType entityType, Long entityId);
}