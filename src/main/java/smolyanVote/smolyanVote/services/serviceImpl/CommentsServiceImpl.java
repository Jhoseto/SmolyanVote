package smolyanVote.smolyanVote.services.serviceImpl;

import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.retry.annotation.Recover;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.mappers.CommentResultMapper;
import smolyanVote.smolyanVote.viewsAndDTO.CommentOutputDto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentsServiceImpl implements CommentsService {

    private static final Logger logger = LoggerFactory.getLogger(CommentsServiceImpl.class);

    private final CommentsRepository commentsRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;
    private final PublicationRepository publicationRepository;
    private final CommentVoteRepository commentVoteRepository;
    private final UserService userService;
    private final CommentResultMapper resultMapper;

    @Autowired
    public CommentsServiceImpl(CommentsRepository commentsRepository,
                               SimpleEventRepository simpleEventRepository,
                               ReferendumRepository referendumRepository,
                               MultiPollRepository multiPollRepository,
                               PublicationRepository publicationRepository,
                               CommentVoteRepository commentVoteRepository,
                               UserService userService,
                               CommentResultMapper resultMapper) {
        this.commentsRepository = commentsRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.publicationRepository = publicationRepository;
        this.commentVoteRepository = commentVoteRepository;
        this.userService = userService;
        this.resultMapper = resultMapper;
    }

    // ====== ОСНОВНИ МЕТОДИ ======

    @Override
    @Transactional(readOnly = true)
    public Page<CommentOutputDto> getCommentsForEntity(String entityType, Long entityId, int page, int size, String sort) {
        String currentUsername = getCurrentUsername();

        switch (entityType) {
            case "publication":
                return getOptimizedCommentsForPublication(entityId, page, size, sort, currentUsername);
            case "simpleEvent":
                return getOptimizedCommentsForEvent(entityId, page, size, sort, currentUsername);
            case "referendum":
                return getOptimizedCommentsForReferendum(entityId, page, size, sort, currentUsername);
            case "multiPoll":
                return getOptimizedCommentsForMultiPoll(entityId, page, size, sort, currentUsername);
            default:
                throw new IllegalArgumentException("Invalid entity type: " + entityType);
        }
    }

    @Transactional(readOnly = true)
    public Page<CommentOutputDto> getOptimizedCommentsForPublication(Long publicationId, int page, int size, String sort, String currentUsername) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(page, size);

        Page<Object[]> rawResults = commentsRepository.findOptimizedCommentsForPublication(
                publicationId, currentUsername, sort, pageable);

        return rawResults.map(row -> resultMapper.mapOptimizedQueryResult(row, currentUsername));
    }

    @Transactional(readOnly = true)
    public Page<CommentOutputDto> getOptimizedCommentsForEvent(Long eventId, int page, int size, String sort, String currentUsername) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(page, size);

        Page<Object[]> rawResults = commentsRepository.findOptimizedCommentsForEvent(
                eventId, currentUsername, sort, pageable);

        return rawResults.map(row -> resultMapper.mapOptimizedQueryResult(row, currentUsername));
    }

    @Transactional(readOnly = true)
    public Page<CommentOutputDto> getOptimizedCommentsForReferendum(Long referendumId, int page, int size, String sort, String currentUsername) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(page, size);

        Page<Object[]> rawResults = commentsRepository.findOptimizedCommentsForReferendum(
                referendumId, currentUsername, sort, pageable);

        return rawResults.map(row -> resultMapper.mapOptimizedQueryResult(row, currentUsername));
    }

    @Transactional(readOnly = true)
    public Page<CommentOutputDto> getOptimizedCommentsForMultiPoll(Long multiPollId, int page, int size, String sort, String currentUsername) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(page, size);

        Page<Object[]> rawResults = commentsRepository.findOptimizedCommentsForMultiPoll(
                multiPollId, currentUsername, sort, pageable);

        return rawResults.map(row -> resultMapper.mapOptimizedQueryResult(row, currentUsername));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentOutputDto> getRepliesForComment(Long commentId, int page, int size) {
        String currentUsername = getCurrentUsername();
        logger.info("Fetching replies for commentId: {}, page: {}, size: {}, user: {}",
                commentId, page, size, currentUsername);

        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 20);
        Pageable pageable = PageRequest.of(page, size);

        Page<Object[]> rawResults = commentsRepository.findOptimizedRepliesForComment(
                commentId, currentUsername, pageable);

        return rawResults.map(row -> resultMapper.mapRepliesQueryResult(row, currentUsername));
    }

    // ====== СЪЗДАВАНЕ НА КОМЕНТАРИ ======

    @Override
    @Transactional
    public CommentsEntity addCommentToEntity(String entityType, Long entityId, String text, UserEntity author) {
        logger.info("Adding comment to entityType: {}, entityId: {}, text: {}, author: {}",
                entityType, entityId, text, author.getUsername());
        return switch (entityType) {
            case "publication" -> addCommentToPublication(entityId, text, author);
            case "simpleEvent" -> addCommentToSimpleEvent(entityId, text, author);
            case "referendum" -> addCommentToReferendum(entityId, text, author);
            case "multiPoll" -> addCommentToMultiPoll(entityId, text, author);
            default -> throw new IllegalArgumentException("Invalid entity type: " + entityType);
        };
    }

    @Override
    @Transactional
    public CommentsEntity addCommentToPublication(Long publicationId, String text, UserEntity author) {
        PublicationEntity publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new IllegalArgumentException("Publication not found with id: " + publicationId));

        CommentsEntity comment = new CommentsEntity();
        comment.setText(text);
        comment.setAuthor(author.getUsername());
        comment.setAuthorImage(author.getImageUrl() != null ? author.getImageUrl() : "/default-avatar.jpg");
        comment.setPublication(publication);
        comment.setLikeCount(0);
        comment.setUnlikeCount(0);
        comment.setCreated(Instant.now());
        comment.setEdited(false);

        // ✅ ПОПРАВКА: Първо запазваме коментара
        CommentsEntity savedComment = commentsRepository.save(comment);

        // ✅ ПОПРАВКА: После инкрементираме брояча
        publication.incrementComments();
        publicationRepository.save(publication);

        logger.info("Comment added to publication {}, new count: {}", publicationId, publication.getCommentsCount());
        return savedComment;
    }

    @Override
    @Transactional
    public CommentsEntity addCommentToSimpleEvent(Long simpleEventId, String text, UserEntity author) {
        SimpleEventEntity simpleEvent = simpleEventRepository.findById(simpleEventId)
                .orElseThrow(() -> new IllegalArgumentException("SimpleEvent not found with id: " + simpleEventId));

        CommentsEntity comment = new CommentsEntity();
        comment.setText(text);
        comment.setAuthor(author.getUsername());
        comment.setAuthorImage(author.getImageUrl() != null ? author.getImageUrl() : "/default-avatar.jpg");
        comment.setEvent(simpleEvent);
        comment.setLikeCount(0);
        comment.setUnlikeCount(0);
        comment.setCreated(Instant.now());
        comment.setEdited(false);

        return commentsRepository.save(comment);
    }

    @Override
    @Transactional
    public CommentsEntity addCommentToReferendum(Long referendumId, String text, UserEntity author) {
        ReferendumEntity referendum = referendumRepository.findById(referendumId)
                .orElseThrow(() -> new IllegalArgumentException("Referendum not found with id: " + referendumId));

        CommentsEntity comment = new CommentsEntity();
        comment.setText(text);
        comment.setAuthor(author.getUsername());
        comment.setAuthorImage(author.getImageUrl() != null ? author.getImageUrl() : "/default-avatar.jpg");
        comment.setReferendum(referendum);
        comment.setLikeCount(0);
        comment.setUnlikeCount(0);
        comment.setCreated(Instant.now());
        comment.setEdited(false);

        return commentsRepository.save(comment);
    }

    @Override
    @Transactional
    public CommentsEntity addCommentToMultiPoll(Long multiPollId, String text, UserEntity author) {
        MultiPollEntity multiPoll = multiPollRepository.findById(multiPollId)
                .orElseThrow(() -> new IllegalArgumentException("MultiPoll not found with id: " + multiPollId));

        CommentsEntity comment = new CommentsEntity();
        comment.setText(text);
        comment.setAuthor(author.getUsername());
        comment.setAuthorImage(author.getImageUrl() != null ? author.getImageUrl() : "/default-avatar.jpg");
        comment.setMultiPoll(multiPoll);
        comment.setLikeCount(0);
        comment.setUnlikeCount(0);
        comment.setCreated(Instant.now());
        comment.setEdited(false);

        return commentsRepository.save(comment);
    }

    @Override
    @Transactional
    public CommentsEntity addReplyToComment(Long parentCommentId, String text, UserEntity author) {
        logger.info("Adding reply to parentCommentId: {}, text: {}, author: {}",
                parentCommentId, text, author.getUsername());
        CommentsEntity parentComment = commentsRepository.findById(parentCommentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));

        CommentsEntity reply = new CommentsEntity();
        reply.setText(text);
        reply.setAuthor(author.getUsername());
        reply.setAuthorImage(author.getImageUrl() != null ? author.getImageUrl() : "/default-avatar.jpg");
        reply.setParent(parentComment);
        reply.setLikeCount(0);
        reply.setUnlikeCount(0);
        reply.setCreated(Instant.now());
        reply.setEdited(false);

        if (parentComment.getPublication() != null) {
            reply.setPublication(parentComment.getPublication());
        } else if (parentComment.getEvent() != null) {
            reply.setEvent(parentComment.getEvent());
        } else if (parentComment.getReferendum() != null) {
            reply.setReferendum(parentComment.getReferendum());
        } else if (parentComment.getMultiPoll() != null) {
            reply.setMultiPoll(parentComment.getMultiPoll());
        }

        // ✅ ПОПРАВКА: Запазваме отговора първо
        CommentsEntity savedReply = commentsRepository.save(reply);

        // ✅ ПОПРАВКА: И отговорите се броят в общата бройка!
        if (parentComment.getPublication() != null) {
            PublicationEntity publication = parentComment.getPublication();
            publication.incrementComments();
            publicationRepository.save(publication);
            logger.info("Reply added to publication {}, new count: {}",
                    publication.getId(), publication.getCommentsCount());
        }

        return savedReply;
    }

    // ====== РЕДАКТИРАНЕ И ИЗТРИВАНЕ ======

    @Override
    @Transactional
    public CommentsEntity updateComment(Long commentId, String newText, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!canModifyComment(comment, user)) {
            throw new IllegalArgumentException("User cannot edit this comment");
        }

        comment.setText(newText);
        comment.setEdited(true);
        comment.setModified(Instant.now());

        return commentsRepository.save(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!canModifyComment(comment, user)) {
            throw new IllegalArgumentException("User cannot delete this comment");
        }

        // ✅ ПОПРАВКА: Броим ВСИЧКИ коментари които ще се изтрият
        int totalCommentsToDelete = countCommentsToDelete(comment);

        // Декрементираме общата бройка
        if (comment.getPublication() != null) {
            PublicationEntity publication = comment.getPublication();

            // Декрементираме с общия брой коментари които ще се изтрият
            for (int i = 0; i < totalCommentsToDelete; i++) {
                publication.decrementComments();
            }
            publicationRepository.save(publication);

            logger.info("Deleting {} comments from publication {}, new count: {}",
                    totalCommentsToDelete, publication.getId(), publication.getCommentsCount());
        }

        commentsRepository.delete(comment);
    }

    // ====== РЕАКЦИИ ======

    @Override
    @Transactional
    public Map<String, Object> toggleCommentVote(Long commentId, UserEntity user, CommentReactionType reactionType) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        Optional<CommentVoteEntity> existingVote = commentVoteRepository.findByCommentIdAndUsername(commentId, user.getUsername());

        String userReaction = null;

        if (existingVote.isPresent()) {
            CommentVoteEntity vote = existingVote.get();
            if (vote.getReaction().equals(reactionType)) {
                commentVoteRepository.delete(vote);
                comment.getVotes().remove(vote);
                userReaction = "NONE";
            } else {
                vote.setReaction(reactionType);
                commentVoteRepository.save(vote);
                userReaction = reactionType.name();
            }
        } else {
            CommentVoteEntity newVote = new CommentVoteEntity();
            newVote.setComment(comment);
            newVote.setUsername(user.getUsername());
            newVote.setReaction(reactionType);
            comment.getVotes().add(newVote);
            commentVoteRepository.save(newVote);
            userReaction = reactionType.name();
        }

        updateCommentCounters(comment);
        commentsRepository.save(comment);

        Map<String, Object> result = new HashMap<>();
        result.put("likesCount", comment.getLikeCount());
        result.put("dislikesCount", comment.getUnlikeCount());
        result.put("userReaction", userReaction);
        result.put("message", userReaction != null && !"NONE".equals(userReaction) ?
                "Реакцията е записана" : "Реакцията е премахната");

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public String getUserReaction(Long commentId, String username) {
        return commentVoteRepository.findByCommentIdAndUsername(commentId, username)
                .map(vote -> vote.getReaction().name())
                .orElse("NONE");
    }

    // ====== БРОЕНЕ ======

    @Override
    @Transactional(readOnly = true)
    public long countCommentsForPublication(Long publicationId) {
        return commentsRepository.countByPublicationId(publicationId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countCommentsForSimpleEvent(Long simpleEventId) {
        return commentsRepository.countByEventId(simpleEventId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countCommentsForReferendum(Long referendumId) {
        return commentsRepository.countByReferendumId(referendumId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countCommentsForMultiPoll(Long multiPollId) {
        return commentsRepository.countByMultiPollId(multiPollId);
    }

    @Override
    public CommentOutputDto convertEntityToDto(CommentsEntity comment) {
        String currentUsername = getCurrentUsername();
        return convertEntityToDto(comment, currentUsername);
    }

    // ====== CONVERSION МЕТОДИ ======

    public CommentOutputDto convertEntityToDto(CommentsEntity comment, String currentUsername) {
        String userReaction = getUserReaction(comment.getId(), currentUsername);
        String entityType = determineEntityType(comment);
        Long entityId = determineEntityId(comment);
        long repliesCount = commentsRepository.countRepliesByParentId(comment.getId());
        boolean canEdit = currentUsername != null && (currentUsername.equals(comment.getAuthor()) ||
                userService.getCurrentUser().getRole().equals(UserRole.ADMIN));

        return new CommentOutputDto(
                comment.getId(),
                comment.getText(),
                comment.getCreated() != null ? LocalDateTime.ofInstant(comment.getCreated(), ZoneId.systemDefault()) : null,
                comment.getModified() != null ? LocalDateTime.ofInstant(comment.getModified(), ZoneId.systemDefault()) : null,
                comment.getAuthor(),
                comment.getAuthorImage() != null ? comment.getAuthorImage() : "/default-avatar.jpg",
                false, // isOnline временно е false
                comment.getLikeCount(),
                comment.getUnlikeCount(),
                (int) repliesCount,
                comment.getParent() != null ? comment.getParent().getId() : null,
                entityType,
                entityId,
                comment.isEdited(),
                canEdit,
                userReaction
        );
    }

    // ====== HELPER МЕТОДИ ======

    private String getCurrentUsername() {
        try {
            UserEntity currentUser = userService.getCurrentUser();
            return currentUser != null ? currentUser.getUsername() : null;
        } catch (Exception e) {
            logger.warn("Error getting current username: {}", e.getMessage());
            return null; // Guest user
        }
    }

    private String determineEntityType(CommentsEntity comment) {
        if (comment.getPublication() != null) return "publication";
        if (comment.getEvent() != null) return "simpleEvent";
        if (comment.getReferendum() != null) return "referendum";
        if (comment.getMultiPoll() != null) return "multiPoll";
        return null;
    }

    private Long determineEntityId(CommentsEntity comment) {
        if (comment.getPublication() != null) return comment.getPublication().getId();
        if (comment.getEvent() != null) return comment.getEvent().getId();
        if (comment.getReferendum() != null) return comment.getReferendum().getId();
        if (comment.getMultiPoll() != null) return comment.getMultiPoll().getId();
        return null;
    }

    private boolean canModifyComment(@NotNull CommentsEntity comment, @NotNull UserEntity user) {
        return comment.getAuthor().equals(user.getUsername()) ||
                user.getRole().equals(UserRole.ADMIN);
    }

    /**
     * ✅ НОВА ПОПРАВКА: Брои колко общо коментари ще се изтрият (главен + всички подкоментари)
     */
    private int countCommentsToDelete(CommentsEntity comment) {
        int count = 1; // Самия коментар

        // Ако това е главен коментар, добавяме и всичките му отговори
        if (comment.getParent() == null) {
            long repliesCount = commentsRepository.countRepliesByParentId(comment.getId());
            count += (int) repliesCount;
            logger.debug("Comment {} has {} replies, total to delete: {}",
                    comment.getId(), repliesCount, count);
        }

        return count;
    }

    /**
     * ✅ БОНУС: Метод за синхронизация на съществуващи публикации
     * Извикай го веднъж за да поправиш старите данни
     */
    @Transactional
    public void synchronizeCommentsCountForAllPublications() {
        logger.info("Starting comments count synchronization...");

        List<PublicationEntity> allPublications = publicationRepository.findAll();
        int updatedCount = 0;

        for (PublicationEntity publication : allPublications) {
            long actualCommentsCount = commentsRepository.countByPublicationId(publication.getId());

            if (publication.getCommentsCount() != actualCommentsCount) {
                logger.info("Publication {}: stored count = {}, actual count = {}",
                        publication.getId(), publication.getCommentsCount(), actualCommentsCount);

                publication.setCommentsCount((int) actualCommentsCount);
                publicationRepository.save(publication);
                updatedCount++;
            }
        }

        logger.info("Comments count synchronization completed. Updated {} publications.", updatedCount);
    }

    private Sort createSortForComments(String sortType) {
        return switch (sortType != null ? sortType.toLowerCase() : "newest") {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "created");
            case "newest" -> Sort.by(Sort.Direction.DESC, "created");
            case "likes" -> Sort.by(Sort.Direction.DESC, "text");  // Сортиране по дължина ще се прави в SQL
            case "popular" -> Sort.by(Sort.Direction.DESC, "likeCount")
                    .and(Sort.by(Sort.Direction.ASC, "unlikeCount"));
            default -> Sort.by(Sort.Direction.DESC, "created");
        };
    }

    private Pageable createPageable(int page, int size, String sort) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        Sort sortBy = createSortForComments(sort);
        return PageRequest.of(page, size, sortBy);
    }

    @Transactional
    protected void updateCommentCounters(CommentsEntity comment) {
        long likeCount = commentVoteRepository.countByCommentIdAndReaction(comment.getId(), CommentReactionType.LIKE);
        long dislikeCount = commentVoteRepository.countByCommentIdAndReaction(comment.getId(), CommentReactionType.DISLIKE);

        comment.setLikeCount((int) likeCount);
        comment.setUnlikeCount((int) dislikeCount);
    }

    @Recover
    public CommentsEntity recoverFromDeadlock(Exception e, Long commentId, String type, String username) {
        logger.error("Failed to apply comment reaction after retries: {}", e.getMessage(), e);
        throw new RuntimeException("Системна грешка при запазване на реакцията. Моля, опитайте отново.");
    }

    // ====== LEGACY МЕТОДИ ======

    @Override
    public boolean commentExists(Long commentId) {
        return commentsRepository.existsById(commentId);
    }

    @Override
    public CommentsEntity getCommentById(Long commentId) {
        return commentsRepository.findById(commentId).orElse(null);
    }

    @Override
    public boolean canUserEditComment(Long commentId, UserEntity user) {
        CommentsEntity comment = getCommentById(commentId);
        return comment != null && canModifyComment(comment, user);
    }

    @Override
    public boolean canUserDeleteComment(Long commentId, UserEntity user) {
        return canUserEditComment(commentId, user);
    }

    @Transactional
    @Override
    public void fillCommentsCountsForAllPublications(List<PublicationEntity> publications) {
        if (publications == null || publications.isEmpty()) {
            return;
        }

        try {
            // Извличаме всички publication IDs
            List<Long> publicationIds = publications.stream()
                    .map(PublicationEntity::getId)
                    .collect(Collectors.toList());

            // Batch заявка за comments counts
            List<Object[]> results = commentsRepository.findCommentsCountsForPublications(publicationIds);

            // Създаваме Map за бърз lookup
            Map<Long, Integer> countsMap = new HashMap<>();
            for (Object[] row : results) {
                Long publicationId = ((Number) row[0]).longValue();
                Integer count = ((Number) row[1]).intValue();
                countsMap.put(publicationId, count);
            }

            // Попълваме commentsCount за всяка публикация
            for (PublicationEntity publication : publications) {
                Integer count = countsMap.getOrDefault(publication.getId(), 0);
                publication.setCommentsCount(count);
            }

        } catch (Exception e) {
            // Fallback - оставяме commentsCount както е
            System.err.println("Error filling comments counts: " + e.getMessage());
        }
    }
}