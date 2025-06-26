package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ReportReasonEnum;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.ReportsRepository;
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

    private static final int MAX_REPORTS_PER_HOUR = 5;
    private static final int MAX_REPORTS_PER_DAY = 20;

    @Autowired
    public ReportsServiceImpl(ReportsRepository reportsRepository,
                              @Lazy PublicationService publicationService) {
        this.reportsRepository = reportsRepository;
        this.publicationService = publicationService;
    }

    @Override
    public void createReport(Long publicationId, UserEntity reporter, String reasonString, String description) {
        // Валидация
        if (!canUserReport(publicationId, reporter)) {
            throw new IllegalStateException("Не можете да докладвате тази публикация");
        }

        if (hasUserExceededReportLimit(reporter)) {
            throw new IllegalStateException("Превишили сте лимита за доклади");
        }

        // Намиране на публикацията
        PublicationEntity publication = publicationService.findById(publicationId);
        if (publication == null) {
            throw new IllegalArgumentException("Публикацията не е намерена");
        }

        // Проверка дали вече е докладвана от този потребител
        if (hasUserReportedPublication(publicationId, reporter.getId())) {
            throw new IllegalStateException("Вече сте докладвали тази публикация");
        }

        // Създаване на доклада
        ReportReasonEnum reason = ReportReasonEnum.fromString(reasonString);
        ReportsEntity report = new ReportsEntity(publication, reporter, reason);

        if (description != null && !description.trim().isEmpty()) {
            report.setDescription(description.trim());
        }

        reportsRepository.save(report);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserReport(Long publicationId, UserEntity user) {
        if (user == null || publicationId == null) {
            return false;
        }

        // Потребителят не може да докладва собствените си публикации
        PublicationEntity publication = publicationService.findById(publicationId);
        if (publication != null && publication.getAuthor().getId().equals(user.getId())) {
            return false;
        }

        // Админите не докладват публикации
        return !user.getRole().equals(UserRole.ADMIN);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReportedPublication(Long publicationId, Long userId) {
        return reportsRepository.existsByPublicationIdAndReporterId(publicationId, userId);
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
    public List<ReportsEntity> getReportsForPublication(Long publicationId) {
        return reportsRepository.findByPublicationIdOrderByCreatedAtDesc(publicationId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getReportsCountForPublication(Long publicationId) {
        return reportsRepository.countByPublicationId(publicationId);
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

        return stats;
    }
}