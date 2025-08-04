package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.*;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.ReportsService;
import smolyanVote.smolyanVote.viewsAndDTO.GroupedReportsDTO;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class ReportsServiceImpl implements ReportsService {

    private final ReportsRepository reportsRepository;
    private final PublicationRepository publicationRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;

    private final ActivityLogService activityLogService;

    private static final int MAX_REPORTS_PER_HOUR = 5;
    private static final int MAX_REPORTS_PER_DAY = 20;

    @Autowired
    public ReportsServiceImpl(
            ReportsRepository reportsRepository,
            PublicationRepository publicationRepository,
            SimpleEventRepository simpleEventRepository,
            ReferendumRepository referendumRepository,
            MultiPollRepository multiPollRepository,
            ActivityLogService activityLogService) {
        this.reportsRepository = reportsRepository;
        this.publicationRepository = publicationRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.activityLogService = activityLogService;
    }

    // ===== ГЛАВЕН МЕТОД ЗА СЪЗДАВАНЕ НА ДОКЛАДИ =====

    @Override
    @LogActivity(action = ActivityActionEnum.REPORT_EVENT, entityType = EventType.REPORT,
            entityIdParam = "entityId", details = "Reported {entityType}: {reasonString}")

    public void createReport(ReportableEntityType entityType, Long entityId, UserEntity reporter,
                             String reasonString, String description) {
        //Валидации
        validateReportCreation(entityType, entityId, reporter, reasonString);

        // Проверка дали entity съществува
        if (!entityExists(entityType, entityId)) {
            throw new IllegalArgumentException(entityType.getDisplayName() + " не е намерен(а)");
        }

        // Проверка дали вече е докладван
        if (hasUserReportedEntity(entityType, entityId, reporter.getUsername())) {
            throw new IllegalStateException("Вече сте докладвали " + entityType.getDisplayName().toLowerCase());
        }

        // Проверка дали може да докладва
        if (!canUserReportEntity(entityType, entityId, reporter)) {
            throw new IllegalStateException("Не можете да докладвате този " + entityType.getDisplayName().toLowerCase());
        }

        // Проверка за rate limiting
        if (hasUserExceededReportLimit(reporter)) {
            throw new IllegalStateException("Превишили сте лимита за доклади (максимум " +
                    MAX_REPORTS_PER_HOUR + " на час, " + MAX_REPORTS_PER_DAY + " на ден)");
        }

        // Създаване на доклада
        ReportReasonEnum reason = ReportReasonEnum.fromString(reasonString);
        ReportsEntity report = new ReportsEntity(entityType, entityId, reporter.getUsername(), reason);

        if (description != null && !description.trim().isEmpty()) {
            report.setDescription(description.trim());
        }

        reportsRepository.save(report);
        // Activity logging for admin log panel СЛЕД успешното създаване
        try {
            // Избираме правилния action според entity type
            ActivityActionEnum actionEnum = switch (entityType) {
                case PUBLICATION -> ActivityActionEnum.REPORT_PUBLICATION;
                case SIMPLE_EVENT -> ActivityActionEnum.REPORT_EVENT;
                case REFERENDUM -> ActivityActionEnum.REPORT_REFERENDUM;
                case MULTI_POLL -> ActivityActionEnum.REPORT_EVENT; // няма специален
                case SIGNAL -> ActivityActionEnum.REPORT_EVENT; // няма специален
                case COMMENT -> ActivityActionEnum.REPORT_COMMENT;
            };

            String details = String.format("Reported %s (Reason: %s)",
                    entityType.getDisplayName(),
                    reasonString);

            activityLogService.logActivity(actionEnum, reporter, entityType.name(), entityId, details, null, null);
        } catch (Exception e) {
            System.err.println("Failed to log report creation: " + e.getMessage());
        }
    }

    // ===== ПРОВЕРКИ =====

    @Override
    @Transactional(readOnly = true)
    public boolean canUserReportEntity(ReportableEntityType entityType, Long entityId, UserEntity user) {
        if (user == null || entityId == null) {
            return false;
        }

        // Админите не докладват
        if (user.getRole().equals(UserRole.ADMIN)) {
            return false;
        }

        // Проверка дали entity съществува
        if (!entityExists(entityType, entityId)) {
            return false;
        }

        // Проверка дали потребителят не е автор/creator
        return !isUserCreatorOfEntity(entityType, entityId, user.getUsername());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReportedEntity(ReportableEntityType entityType, Long entityId, String username) {
        return reportsRepository.existsByEntityTypeAndEntityIdAndReporterUsername(entityType, entityId, username);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserExceededReportLimit(UserEntity user) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);

        long reportsLastHour = reportsRepository.countByReporterUsernameAndCreatedAtAfter(user.getUsername(), oneHourAgo);
        long reportsLastDay = reportsRepository.countByReporterUsernameAndCreatedAtAfter(user.getUsername(), oneDayAgo);

        return reportsLastHour >= MAX_REPORTS_PER_HOUR || reportsLastDay >= MAX_REPORTS_PER_DAY;
    }

    // ===== ИЗВЛИЧАНЕ НА ДОКЛАДИ =====

    @Override
    @Transactional(readOnly = true)
    public List<ReportsEntity> getReportsForEntity(ReportableEntityType entityType, Long entityId) {
        return reportsRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getReportsCountForEntity(ReportableEntityType entityType, Long entityId) {
        return reportsRepository.countByEntityTypeAndEntityId(entityType, entityId);
    }

    // ===== АДМИН МЕТОДИ =====

    @Override
    @Transactional(readOnly = true)
    public Page<ReportsEntity> getPendingReports(Pageable pageable) {
        return reportsRepository.findByStatusOrderByCreatedAtDesc("PENDING", pageable);
    }

    @Override
    @Transactional
    @LogActivity(action = ActivityActionEnum.ADMIN_REVIEW_REPORT, entityType = EventType.REPORT,
            entityIdParam = "reportId", details = "Status: {status}, Notes: {adminNotes}")

    public void reviewReport(Long reportId, UserEntity admin, String status, String adminNotes) {
        Optional<ReportsEntity> reportOpt = reportsRepository.findById(reportId);
        if (reportOpt.isEmpty()) {
            throw new IllegalArgumentException("Докладът не е намерен");
        }

        ReportsEntity report = reportOpt.get();
        report.setStatus("REVIEWED");
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewedByUsername(admin.getUsername());

        if (adminNotes != null && !adminNotes.trim().isEmpty()) {
            report.setAdminNotes(adminNotes.trim());
        }

        reportsRepository.save(report);
    }

    // ===== СТАТИСТИКИ =====

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getReportsStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Общ брой доклади
        long totalReports = reportsRepository.count();
        stats.put("totalReports", totalReports);

        // Pending доклади
        long pendingReports = reportsRepository.findByStatusOrderByCreatedAtDesc("PENDING", Pageable.unpaged()).getTotalElements();
        stats.put("pendingReports", pendingReports);

        // Доклади за последните 24 часа
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        long recentReports = reportsRepository.countReportsSince(yesterday);
        stats.put("recentReports", recentReports);

        // Доклади по причини
        List<Object[]> reasonStats = reportsRepository.getReportsCountByReason("PENDING");
        Map<String, Long> reasonCounts = new HashMap<>();
        for (Object[] stat : reasonStats) {
            ReportReasonEnum reason = (ReportReasonEnum) stat[0];
            Long count = (Long) stat[1];
            reasonCounts.put(reason.name(), count);
        }
        stats.put("reasonCounts", reasonCounts);

        // Статистики по типове entities
        List<Object[]> entityTypeStats = reportsRepository.getReportsCountByEntityType("PENDING");
        Map<String, Long> entityTypeCounts = new HashMap<>();
        for (Object[] stat : entityTypeStats) {
            ReportableEntityType entityType = (ReportableEntityType) stat[0];
            Long count = (Long) stat[1];
            entityTypeCounts.put(entityType.name(), count);
        }
        stats.put("entityTypeCounts", entityTypeCounts);

        return stats;
    }

    // ===== ИЗТРИВАНЕ НА ДОКЛАДИ =====

    @Override
    @Transactional
    public void deleteAllReportsForEntity(ReportableEntityType entityType, Long entityId) {
        try {
            // Проверяваме дали има доклади за този entity
            long reportsCount = reportsRepository.countByEntityTypeAndEntityId(entityType, entityId);

            if (reportsCount > 0) {
                // Изтриваме всички доклади
                reportsRepository.deleteAllByEntityTypeAndEntityId(entityType, entityId);
                System.out.println("Deleted " + reportsCount + " reports for " +
                        entityType.getDisplayName() + " with ID " + entityId);
            } else {
                System.out.println("No reports found for " + entityType.getDisplayName() + " with ID " + entityId);
            }
        } catch (Exception e) {
            System.err.println("ERROR deleting reports for " + entityType.getDisplayName() + " " + entityId +
                    ": " + e.getMessage());
            e.printStackTrace();
            // Не хвърляме exception за да не блокираме изтриването на основния entity
        }
    }

    // ===== ПОМОЩНИ МЕТОДИ =====

    private void validateReportCreation(ReportableEntityType entityType, Long entityId,
                                        UserEntity reporter, String reasonString) {
        if (entityType == null) {
            throw new IllegalArgumentException("Типът на обекта е задължителен");
        }
        if (entityId == null) {
            throw new IllegalArgumentException("ID на обекта е задължително");
        }
        if (reporter == null) {
            throw new IllegalArgumentException("Потребител е задължителен");
        }
        if (reasonString == null || reasonString.trim().isEmpty()) {
            throw new IllegalArgumentException("Причината е задължителна");
        }
    }

    private boolean entityExists(ReportableEntityType entityType, Long entityId) {
        return switch (entityType) {
            case PUBLICATION -> publicationRepository.existsById(entityId);
            case SIMPLE_EVENT -> simpleEventRepository.existsById(entityId);
            case REFERENDUM -> referendumRepository.existsById(entityId);
            case MULTI_POLL -> multiPollRepository.existsById(entityId);
        };
    }

    private boolean isUserCreatorOfEntity(ReportableEntityType entityType, Long entityId, String username) {
        return switch (entityType) {
            case PUBLICATION -> {
                Optional<PublicationEntity> pub = publicationRepository.findById(entityId);
                yield pub.isPresent() && pub.get().getAuthor().getUsername().equals(username);
            }
            case SIMPLE_EVENT -> {
                Optional<SimpleEventEntity> event = simpleEventRepository.findById(entityId);
                yield event.isPresent() && event.get().getCreatorName().equals(username);
            }
            case REFERENDUM -> {
                Optional<ReferendumEntity> referendum = referendumRepository.findById(entityId);
                yield referendum.isPresent() && referendum.get().getCreatorName().equals(username);
            }
            case MULTI_POLL -> {
                Optional<MultiPollEntity> poll = multiPollRepository.findById(entityId);
                yield poll.isPresent() && poll.get().getCreatorName().equals(username);
            }
        };
    }



    @Transactional(readOnly = true)
    @Override
    public Page<GroupedReportsDTO> getGroupedReports(Pageable pageable) {
        // Извличаме limit и offset от Pageable
        int limit = pageable.getPageSize();
        int offset = (int) pageable.getOffset();

        // Използваме custom query за групиране
        List<Object[]> groupedResults = reportsRepository.findGroupedReports(limit, offset);

        List<GroupedReportsDTO> groupedReports = new ArrayList<>();

        for (Object[] row : groupedResults) {
            // Native query връща String за enum
            String entityTypeStr = (String) row[0];
            ReportableEntityType entityType = ReportableEntityType.valueOf(entityTypeStr);

            Long entityId = (Long) row[1];
            Long reportCount = (Long) row[2];

            // Native query връща Timestamp, не LocalDateTime
            Timestamp firstReportTs = (Timestamp) row[3];
            Timestamp lastReportTs = (Timestamp) row[4];
            LocalDateTime firstReport = firstReportTs.toLocalDateTime();
            LocalDateTime lastReport = lastReportTs.toLocalDateTime();

            String mostCommonReason = (String) row[5];
            String mostRecentDescription = (String) row[6]; // НОВО
            String status = (String) row[7]; // ВНИМАНИЕ: индексът се променя!

            GroupedReportsDTO dto = new GroupedReportsDTO();
            dto.setEntityType(entityType);
            dto.setEntityId(entityId);
            dto.setReportCount(reportCount.intValue());
            dto.setFirstReportDate(firstReport);
            dto.setLastReportDate(lastReport);
            dto.setMostCommonReason(mostCommonReason);
            dto.setMostRecentDescription(mostRecentDescription); // НОВО
            dto.setStatus(status);

            // Получаваме всички reporter usernames за това entity
            List<String> reporters = reportsRepository.findReportersByEntity(entityType, entityId);
            dto.setReporterUsernames(reporters);

            // Получаваме всички report ID-та за bulk operations
            List<Long> reportIds = reportsRepository.findReportIdsByEntity(entityType, entityId);
            dto.setReportIds(reportIds);

            groupedReports.add(dto);
        }

        // Получаваме общия брой групирани репорти за правилен pagination
        Long totalElements = reportsRepository.countGroupedReports();

        // Създаваме Page wrapper с правилния total count
        return new PageImpl<>(groupedReports, pageable, totalElements);
    }

    @Transactional(readOnly = true)
    @Override
    public List<Long> getReportIdsByEntity(ReportableEntityType entityType, Long entityId) {
        return reportsRepository.findReportIdsByEntity(entityType, entityId);
    }
}