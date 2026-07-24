package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class AdminContentActionServiceImpl implements AdminContentActionService {

    private final PublicationService publicationService;
    private final SignalsService signalsService;
    private final CommentsService commentsService;
    private final DeleteEventsService deleteEventsService;
    private final ReportsService reportsService;
    private final AdminUserManagementService adminUserManagementService;
    private final ActivityLogService activityLogService;
    private final PublicationRepository publicationRepository;
    private final SignalsRepository signalsRepository;
    private final CommentsRepository commentsRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;
    private final UserRepository userRepository;

    public AdminContentActionServiceImpl(
            PublicationService publicationService,
            SignalsService signalsService,
            CommentsService commentsService,
            DeleteEventsService deleteEventsService,
            ReportsService reportsService,
            AdminUserManagementService adminUserManagementService,
            ActivityLogService activityLogService,
            PublicationRepository publicationRepository,
            SignalsRepository signalsRepository,
            CommentsRepository commentsRepository,
            SimpleEventRepository simpleEventRepository,
            ReferendumRepository referendumRepository,
            MultiPollRepository multiPollRepository,
            UserRepository userRepository) {
        this.publicationService = publicationService;
        this.signalsService = signalsService;
        this.commentsService = commentsService;
        this.deleteEventsService = deleteEventsService;
        this.reportsService = reportsService;
        this.adminUserManagementService = adminUserManagementService;
        this.activityLogService = activityLogService;
        this.publicationRepository = publicationRepository;
        this.signalsRepository = signalsRepository;
        this.commentsRepository = commentsRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Map<String, Object> takeActionOnEntity(
            ReportableEntityType entityType,
            Long entityId,
            UserEntity admin,
            String action,
            String adminNotes,
            boolean banAuthor,
            String banReason) {

        String normalizedAction = action == null ? "DELETE" : action.trim().toUpperCase();
        Map<String, Object> result = new HashMap<>();
        result.put("entityType", entityType.name());
        result.put("entityId", entityId);
        result.put("action", normalizedAction);

        Long authorId = resolveAuthorId(entityType, entityId);
        result.put("authorId", authorId);

        switch (normalizedAction) {
            case "DELETE" -> {
                resolveAllReports(entityType, entityId, admin, adminNotes, "RESOLVED");
                deleteEntity(entityType, entityId, admin);
            }
            case "RESOLVE_SIGNAL" -> {
                SignalsEntity signal = signalsRepository.findById(entityId)
                        .orElseThrow(() -> new IllegalArgumentException("Сигналът не е намерен"));
                signalsService.moderate(signal, adminNotes, true, admin);
                resolveAllReports(entityType, entityId, admin, adminNotes, "RESOLVED");
            }
            case "DISMISS" -> resolveAllReports(entityType, entityId, admin, adminNotes, "DISMISSED");
            default -> throw new IllegalArgumentException("Непознато действие: " + action);
        }

        if (banAuthor && authorId != null) {
            String reason = (banReason != null && !banReason.isBlank())
                    ? banReason.trim()
                    : "Модерация след репорт";
            Map<String, String> banResult = adminUserManagementService.banUser(
                    authorId, reason, "temporary", 7, null);
            result.put("banResult", banResult);
        }

        activityLogService.logActivity(
                ActivityActionEnum.ADMIN_DELETE_CONTENT,
                admin,
                entityType.name(),
                entityId,
                "Action: " + normalizedAction + (adminNotes != null ? ", notes: " + adminNotes : ""),
                null,
                null);

        result.put("success", true);
        result.put("message", "Действието е изпълнено успешно");
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Long resolveAuthorId(ReportableEntityType entityType, Long entityId) {
        if (entityId == null) {
            return null;
        }
        return switch (entityType) {
            case PUBLICATION -> publicationRepository.findById(entityId)
                    .map(PublicationEntity::getAuthor)
                    .map(UserEntity::getId)
                    .orElse(null);
            case SIGNAL -> signalsRepository.findById(entityId)
                    .map(SignalsEntity::getAuthor)
                    .map(UserEntity::getId)
                    .orElse(null);
            case COMMENT -> commentsRepository.findById(entityId)
                    .map(CommentsEntity::getAuthor)
                    .flatMap(username -> userRepository.findByUsername(username).map(UserEntity::getId))
                    .orElse(null);
            case SIMPLE_EVENT -> simpleEventRepository.findById(entityId)
                    .flatMap(e -> userRepository.findByUsername(e.getCreatorName()).map(UserEntity::getId))
                    .orElse(null);
            case REFERENDUM -> referendumRepository.findById(entityId)
                    .flatMap(e -> userRepository.findByUsername(e.getCreatorName()).map(UserEntity::getId))
                    .orElse(null);
            case MULTI_POLL -> multiPollRepository.findById(entityId)
                    .flatMap(e -> userRepository.findByUsername(e.getCreatorName()).map(UserEntity::getId))
                    .orElse(null);
            case USER -> entityId;
        };
    }

    private void deleteEntity(ReportableEntityType entityType, Long entityId, UserEntity admin) {
        switch (entityType) {
            case PUBLICATION -> publicationService.delete(entityId);
            case SIGNAL -> signalsService.delete(entityId);
            case COMMENT -> commentsService.deleteComment(entityId, admin);
            case SIMPLE_EVENT, REFERENDUM, MULTI_POLL -> deleteEventsService.deleteEvent(entityId);
            case USER -> adminUserManagementService.deleteUser(entityId);
            default -> throw new IllegalArgumentException("Изтриване не се поддържа за: " + entityType);
        }
    }

    private void resolveAllReports(
            ReportableEntityType entityType,
            Long entityId,
            UserEntity admin,
            String adminNotes,
            String status) {
        List<Long> reportIds = reportsService.getReportIdsByEntity(entityType, entityId);
        for (Long reportId : reportIds) {
            reportsService.reviewReport(reportId, admin, status, adminNotes);
        }
    }
}
