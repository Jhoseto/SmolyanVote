package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.UserEntity;

import java.util.List;
import java.util.Map;

public interface ReportsService {

    // Създаване на нов доклад
    void createReport(Long publicationId, UserEntity reporter, String reasonString, String description);

    // Проверка дали потребител може да докладва
    boolean canUserReport(Long publicationId, UserEntity user);

    // Администрация
    Page<ReportsEntity> getPendingReports(Pageable pageable);

    ReportsEntity reviewReport(Long reportId, UserEntity admin, String status, String adminNotes);

    List<ReportsEntity> getReportsForPublication(Long publicationId);

    // Статистики
    Map<String, Object> getReportsStatistics();

    long getReportsCountForPublication(Long publicationId);

    boolean hasUserReportedPublication(Long publicationId, Long userId);

    // Rate limiting
    boolean hasUserExceededReportLimit(UserEntity user);
}