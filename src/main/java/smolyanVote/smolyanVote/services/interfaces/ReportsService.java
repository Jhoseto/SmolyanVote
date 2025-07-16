package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.util.List;
import java.util.Map;

public interface ReportsService {

    // ===== LEGACY PUBLICATION METHODS (запазени за обратна съвместимост) =====

    /**
     * Създава доклад за публикация (legacy метод)
     */
    void createReport(Long publicationId, UserEntity reporter, String reasonString, String description);

    /**
     * Проверява дали потребител може да докладва публикация
     */
    boolean canUserReport(Long publicationId, UserEntity user);

    /**
     * Проверява дали потребител е докладвал публикация
     */
    boolean hasUserReportedPublication(Long publicationId, Long userId);

    /**
     * Връща доклади за публикация
     */
    List<ReportsEntity> getReportsForPublication(Long publicationId);

    /**
     * Брои доклади за публикация
     */
    long getReportsCountForPublication(Long publicationId);

    // ===== NEW GENERIC METHODS =====

    /**
     * Създава доклад за произволен entity (универсален метод)
     */
    void createEntityReport(ReportableEntityType entityType, Long entityId, UserEntity reporter,
                            String reasonString, String description);

    /**
     * Проверява дали потребител може да докладва произволен entity
     */
    boolean canUserReportEntity(ReportableEntityType entityType, Long entityId, UserEntity user);

    /**
     * Проверява дали потребител е докладвал произволен entity
     */
    boolean hasUserReportedEntity(ReportableEntityType entityType, Long entityId, Long userId);

    /**
     * Връща доклади за произволен entity
     */
    List<ReportsEntity> getReportsForEntity(ReportableEntityType entityType, Long entityId);

    /**
     * Брои доклади за произволен entity
     */
    long getReportsCountForEntity(ReportableEntityType entityType, Long entityId);

    // ===== SPECIFIC EVENT METHODS =====

    /**
     * Създава доклад за SimpleEvent
     */
    void createSimpleEventReport(Long eventId, UserEntity reporter, String reasonString, String description);

    /**
     * Създава доклад за Referendum
     */
    void createReferendumReport(Long referendumId, UserEntity reporter, String reasonString, String description);

    /**
     * Създава доклад за MultiPoll
     */
    void createMultiPollReport(Long multiPollId, UserEntity reporter, String reasonString, String description);

    /**
     * Проверява дали потребител може да докладва SimpleEvent
     */
    boolean canUserReportSimpleEvent(Long eventId, UserEntity user);

    /**
     * Проверява дали потребител може да докладва Referendum
     */
    boolean canUserReportReferendum(Long referendumId, UserEntity user);

    /**
     * Проверява дали потребител може да докладва MultiPoll
     */
    boolean canUserReportMultiPoll(Long multiPollId, UserEntity user);

    /**
     * Проверява дали потребител е докладвал SimpleEvent
     */
    boolean hasUserReportedSimpleEvent(Long eventId, Long userId);

    /**
     * Проверява дали потребител е докладвал Referendum
     */
    boolean hasUserReportedReferendum(Long referendumId, Long userId);

    /**
     * Проверява дали потребител е докладвал MultiPoll
     */
    boolean hasUserReportedMultiPoll(Long multiPollId, Long userId);

    // ===== COMMON ADMIN METHODS =====

    /**
     * Връща pending доклади за админи
     */
    Page<ReportsEntity> getPendingReports(Pageable pageable);

    /**
     * Прегледа доклад (админ операция)
     */
    ReportsEntity reviewReport(Long reportId, UserEntity admin, String status, String adminNotes);

    /**
     * Rate limiting проверка
     */
    boolean hasUserExceededReportLimit(UserEntity user);

    /**
     * Статистики за докладите
     */
    Map<String, Object> getReportsStatistics();

    /**
     * Разширени статистики с breakdown по типове entities
     */
    Map<String, Object> getExtendedReportsStatistics();
}