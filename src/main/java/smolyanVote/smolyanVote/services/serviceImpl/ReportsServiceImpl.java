package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.ReportReasonEnum;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
import smolyanVote.smolyanVote.services.interfaces.ReportsService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class ReportsServiceImpl implements ReportsService {

    private final ReportsRepository reportsRepository;
    private final PublicationService publicationService;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;

    private static final int MAX_REPORTS_PER_HOUR = 5;
    private static final int MAX_REPORTS_PER_DAY = 20;

    @Autowired
    public ReportsServiceImpl(ReportsRepository reportsRepository,
                              @Lazy PublicationService publicationService,
                              SimpleEventRepository simpleEventRepository,
                              ReferendumRepository referendumRepository,
                              MultiPollRepository multiPollRepository) {
        this.reportsRepository = reportsRepository;
        this.publicationService = publicationService;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
    }

    // ===== LEGACY PUBLICATION METHODS (запазени за обратна съвместимост) =====

    @Override
    public void createReport(Long publicationId, UserEntity reporter, String reasonString, String description) {
        // Използваме новия generic метод
        createEntityReport(ReportableEntityType.PUBLICATION, publicationId, reporter, reasonString, description);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserReport(Long publicationId, UserEntity user) {
        return canUserReportEntity(ReportableEntityType.PUBLICATION, publicationId, user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReportedPublication(Long publicationId, Long userId) {
        return hasUserReportedEntity(ReportableEntityType.PUBLICATION, publicationId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportsEntity> getReportsForPublication(Long publicationId) {
        return getReportsForEntity(ReportableEntityType.PUBLICATION, publicationId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getReportsCountForPublication(Long publicationId) {
        return getReportsCountForEntity(ReportableEntityType.PUBLICATION, publicationId);
    }

    // ===== NEW GENERIC METHODS =====

    @Override
    public void createEntityReport(ReportableEntityType entityType, Long entityId, UserEntity reporter,
                                   String reasonString, String description) {
        // Валидация
        if (!canUserReportEntity(entityType, entityId, reporter)) {
            throw new IllegalStateException("Не можете да докладвате този " + entityType.getDisplayName().toLowerCase());
        }

        if (hasUserExceededReportLimit(reporter)) {
            throw new IllegalStateException("Превишили сте лимита за доклади");
        }

        // Проверка дали entity съществува
        if (!entityExists(entityType, entityId)) {
            throw new IllegalArgumentException(entityType.getDisplayName() + " не е намерен(а)");
        }

        // Проверка дали вече е докладван
        if (hasUserReportedEntity(entityType, entityId, reporter.getId())) {
            throw new IllegalStateException("Вече сте докладвали " + entityType.getDisplayName().toLowerCase());
        }

        // Създаване на доклада
        ReportReasonEnum reason = ReportReasonEnum.fromString(reasonString);
        ReportsEntity report = new ReportsEntity(entityType, entityId, reporter, reason);

        if (description != null && !description.trim().isEmpty()) {
            report.setDescription(description.trim());
        }

        // За публикации, добавяме и legacy полето за обратна съвместимост
        if (entityType == ReportableEntityType.PUBLICATION) {
            PublicationEntity publication = publicationService.findById(entityId);
            report.setPublication(publication);
        }

        reportsRepository.save(report);
    }

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
        return !isUserCreatorOfEntity(entityType, entityId, user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReportedEntity(ReportableEntityType entityType, Long entityId, Long userId) {
        return reportsRepository.hasUserReportedEntity(entityType, entityId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportsEntity> getReportsForEntity(ReportableEntityType entityType, Long entityId) {
        return reportsRepository.findReportsForEntity(entityType, entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getReportsCountForEntity(ReportableEntityType entityType, Long entityId) {
        return reportsRepository.countReportsForEntity(entityType, entityId);
    }

    @Override
    public void createSimpleEventReport(Long eventId, UserEntity reporter, String reasonString, String description) {

    }

    @Override
    public void createReferendumReport(Long referendumId, UserEntity reporter, String reasonString, String description) {

    }

    @Override
    public void createMultiPollReport(Long multiPollId, UserEntity reporter, String reasonString, String description) {

    }

    @Override
    public boolean canUserReportSimpleEvent(Long eventId, UserEntity user) {
        return false;
    }

    @Override
    public boolean canUserReportReferendum(Long referendumId, UserEntity user) {
        return false;
    }

    @Override
    public boolean canUserReportMultiPoll(Long multiPollId, UserEntity user) {
        return false;
    }

    @Override
    public boolean hasUserReportedSimpleEvent(Long eventId, Long userId) {
        return false;
    }

    @Override
    public boolean hasUserReportedReferendum(Long referendumId, Long userId) {
        return false;
    }

    @Override
    public boolean hasUserReportedMultiPoll(Long multiPollId, Long userId) {
        return false;
    }

    // ===== COMMON ADMIN METHODS =====

    @Override
    @Transactional(readOnly = true)
    public Page<ReportsEntity> getPendingReports(Pageable pageable) {
        return reportsRepository.findByStatusOrderByCreatedAtDesc("PENDING", pageable);
    }

    @Override
    public ReportsEntity reviewReport(Long reportId, UserEntity admin, String status, String adminNotes) {
        Optional<ReportsEntity> reportOpt = reportsRepository.findById(reportId);
        if (reportOpt.isEmpty()) {
            throw new IllegalArgumentException("Докладът не е намерен");
        }

        ReportsEntity report = reportOpt.get();
        report.setStatus(status.toUpperCase());
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewedBy(admin);

        if (adminNotes != null && !adminNotes.trim().isEmpty()) {
            report.setAdminNotes(adminNotes.trim());
        }

        return reportsRepository.save(report);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserExceededReportLimit(UserEntity user) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);

        long reportsLastHour = reportsRepository.countByReporterIdAndCreatedAtAfter(user.getId(), oneHourAgo);
        long reportsLastDay = reportsRepository.countByReporterIdAndCreatedAtAfter(user.getId(), oneDayAgo);

        return reportsLastHour >= MAX_REPORTS_PER_HOUR || reportsLastDay >= MAX_REPORTS_PER_DAY;
    }

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

        // Статистики по типове entities (нови данни)
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

    @Override
    public Map<String, Object> getExtendedReportsStatistics() {
        return Map.of();
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Проверява дали entity съществува в базата
     */
    private boolean entityExists(ReportableEntityType entityType, Long entityId) {
        return switch (entityType) {
            case PUBLICATION -> publicationService.findById(entityId) != null;
            case SIMPLE_EVENT -> simpleEventRepository.existsById(entityId);
            case REFERENDUM -> referendumRepository.existsById(entityId);
            case MULTI_POLL -> multiPollRepository.existsById(entityId);
        };
    }

    /**
     * Проверява дали потребителят е автор/creator на entity-то
     */
    private boolean isUserCreatorOfEntity(ReportableEntityType entityType, Long entityId, UserEntity user) {
        return switch (entityType) {
            case PUBLICATION -> {
                PublicationEntity publication = publicationService.findById(entityId);
                yield publication != null && publication.getAuthor().getId().equals(user.getId());
            }
            case SIMPLE_EVENT -> {
                Optional<SimpleEventEntity> event = simpleEventRepository.findById(entityId);
                yield event.isPresent() && event.get().getCreatorName().equals(user.getUsername());
            }
            case REFERENDUM -> {
                Optional<ReferendumEntity> referendum = referendumRepository.findById(entityId);
                yield referendum.isPresent() && referendum.get().getCreatorName().equals(user.getUsername());
            }
            case MULTI_POLL -> {
                Optional<MultiPollEntity> multiPoll = multiPollRepository.findById(entityId);
                yield multiPoll.isPresent() && multiPoll.get().getCreatorName().equals(user.getUsername());
            }
        };
    }
}