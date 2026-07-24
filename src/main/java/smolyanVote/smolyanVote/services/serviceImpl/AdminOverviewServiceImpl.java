package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.repositories.PodcastEpisodeRepository;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.repositories.ReportsRepository;
import smolyanVote.smolyanVote.repositories.SignalsRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class AdminOverviewServiceImpl implements AdminOverviewService {

    private final AdminUserManagementService adminUserManagementService;
    private final ReportsService reportsService;
    private final SubscriptionService subscriptionService;
    private final ActivityLogService activityLogService;
    private final ActuatorDataService actuatorDataService;
    private final UserRepository userRepository;
    private final ReportsRepository reportsRepository;
    private final PublicationRepository publicationRepository;
    private final SignalsRepository signalsRepository;
    private final PodcastEpisodeRepository podcastEpisodeRepository;

    public AdminOverviewServiceImpl(
            AdminUserManagementService adminUserManagementService,
            ReportsService reportsService,
            SubscriptionService subscriptionService,
            ActivityLogService activityLogService,
            ActuatorDataService actuatorDataService,
            UserRepository userRepository,
            ReportsRepository reportsRepository,
            PublicationRepository publicationRepository,
            SignalsRepository signalsRepository,
            PodcastEpisodeRepository podcastEpisodeRepository) {
        this.adminUserManagementService = adminUserManagementService;
        this.reportsService = reportsService;
        this.subscriptionService = subscriptionService;
        this.activityLogService = activityLogService;
        this.actuatorDataService = actuatorDataService;
        this.userRepository = userRepository;
        this.reportsRepository = reportsRepository;
        this.publicationRepository = publicationRepository;
        this.signalsRepository = signalsRepository;
        this.podcastEpisodeRepository = podcastEpisodeRepository;
    }

    @Override
    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new HashMap<>();
        overview.put("users", adminUserManagementService.getUserStatistics());
        overview.put("reports", reportsService.getReportsStatistics());
        overview.put("activity", activityLogService.getActivityStatistics());
        overview.put("subscriptions", buildSubscriptionSummary());
        overview.put("strikes", buildStrikeSummary());
        overview.put("content", buildContentSummary());
        overview.put("healthAlerts", getHealthAlerts());
        return overview;
    }

    @Override
    public Map<String, Object> getHealthAlerts() {
        Map<String, Object> alerts = new HashMap<>();
        List<Map<String, String>> items = new ArrayList<>();

        try {
            Map<String, Object> health = actuatorDataService.getHealthData();
            String status = String.valueOf(health.getOrDefault("status", "UNKNOWN"));
            if (!"UP".equalsIgnoreCase(status)) {
                items.add(alert("critical", "Системно здраве", "Статус: " + status));
            }
        } catch (Exception e) {
            items.add(alert("critical", "Системно здраве", "Health check failed"));
        }

        try {
            Map<String, Object> db = actuatorDataService.getDatabaseHealth();
            String dbStatus = String.valueOf(db.getOrDefault("status", "UNKNOWN"));
            if (!"UP".equalsIgnoreCase(dbStatus)) {
                items.add(alert("critical", "База данни", "Статус: " + dbStatus));
            }
        } catch (Exception e) {
            items.add(alert("warning", "База данни", "Не може да се провери"));
        }

        try {
            Map<String, Object> cloudinary = actuatorDataService.getCloudinaryHealth();
            String cStatus = String.valueOf(cloudinary.getOrDefault("status", "UNKNOWN"));
            if (!"UP".equalsIgnoreCase(cStatus)) {
                items.add(alert("warning", "Cloudinary", "Статус: " + cStatus));
            }
        } catch (Exception e) {
            items.add(alert("warning", "Cloudinary", "Не може да се провери"));
        }

        try {
            Map<String, Object> email = actuatorDataService.getEmailServiceHealth();
            String eStatus = String.valueOf(email.getOrDefault("status", "UNKNOWN"));
            if (!"UP".equalsIgnoreCase(eStatus)) {
                items.add(alert("warning", "Email", "Статус: " + eStatus));
            }
        } catch (Exception e) {
            items.add(alert("warning", "Email", "Не може да се провери"));
        }

        Map<String, Object> reportStats = reportsService.getReportsStatistics();
        long pending = ((Number) reportStats.getOrDefault("pendingReports", 0L)).longValue();
        if (pending >= 10) {
            items.add(alert("warning", "Репорти", pending + " чакащи репорта"));
        } else if (pending > 0) {
            items.add(alert("info", "Репорти", pending + " чакащи репорта"));
        }

        long atRisk = userRepository.findAll().stream()
                .filter(u -> u.getModerationStrikeCount() >= 2)
                .count();
        if (atRisk > 0) {
            items.add(alert("warning", "Strikes", atRisk + " потребители с ≥2 strikes"));
        }

        alerts.put("alerts", items);
        alerts.put("criticalCount", items.stream().filter(a -> "critical".equals(a.get("level"))).count());
        alerts.put("warningCount", items.stream().filter(a -> "warning".equals(a.get("level"))).count());
        return alerts;
    }

    private Map<String, String> alert(String level, String title, String message) {
        Map<String, String> a = new HashMap<>();
        a.put("level", level);
        a.put("title", title);
        a.put("message", message);
        return a;
    }

    private Map<String, Object> buildSubscriptionSummary() {
        Map<String, Object> sub = new HashMap<>();
        sub.put("total", subscriptionService.getTotalSubscribersCount());
        subscriptionService.getSubscriptionStats().forEach((type, count) ->
                sub.put(type.name(), count));
        return sub;
    }

    private Map<String, Object> buildStrikeSummary() {
        var users = userRepository.findAll();
        Map<String, Object> strikes = new HashMap<>();
        strikes.put("withOneStrike", users.stream().filter(u -> u.getModerationStrikeCount() == 1).count());
        strikes.put("withTwoStrikes", users.stream().filter(u -> u.getModerationStrikeCount() == 2).count());
        strikes.put("withThreeOrMore", users.stream().filter(u -> u.getModerationStrikeCount() >= 3).count());
        strikes.put("autoBannedNow", users.stream()
                .filter(u -> UserStatusEnum.TEMPORARILY_BANNED.equals(u.getStatus())
                        && u.getModerationStrikeCount() >= 3)
                .count());
        return strikes;
    }

    private Map<String, Object> buildContentSummary() {
        Map<String, Object> content = new HashMap<>();
        content.put("publications", publicationRepository.count());
        content.put("signals", signalsRepository.count());
        content.put("podcastEpisodes", podcastEpisodeRepository.count());
        content.put("podcastPublished", podcastEpisodeRepository.countByIsPublishedTrue());
        content.put("pendingReports", reportsRepository.findByStatusOrderByCreatedAtDesc(
                "PENDING", org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
        return content;
    }
}
