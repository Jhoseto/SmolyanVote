package smolyanVote.smolyanVote.services.serviceImpl;

import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Recover;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.CommentDto;

import java.time.Instant;
import java.util.*;

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

    @Autowired
    public CommentsServiceImpl(CommentsRepository commentsRepository,
                               SimpleEventRepository simpleEventRepository,
                               ReferendumRepository referendumRepository,
                               MultiPollRepository multiPollRepository,
                               PublicationRepository publicationRepository,
                               CommentVoteRepository commentVoteRepository,
                               UserService userService) {
        this.commentsRepository = commentsRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.publicationRepository = publicationRepository;
        this.commentVoteRepository = commentVoteRepository;
        this.userService = userService;
    }

    // ====== GENERIC МЕТОДИ ======

    @Override
    @Transactional(readOnly = true)
    public Page<CommentDto> getCommentsForEntity(String entityType, Long entityId, int page, int size, String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CommentsEntity> commentsPage;
        switch (entityType) {
            case "publication":
                commentsPage = commentsRepository.findRootCommentsDtoByPublicationId(entityId, pageable);
                break;
            case "simpleEvent":
                commentsPage = commentsRepository.findRootCommentsDtoByEventId(entityId, pageable);
                break;
            case "referendum":
                commentsPage = commentsRepository.findRootCommentsDtoByReferendumId(entityId, pageable);
                break;
            case "multiPoll":
                commentsPage = commentsRepository.findRootCommentsDtoByMultiPollId(entityId, pageable);
                break;
            default:
                throw new IllegalArgumentException("Invalid entity type: " + entityType);
        }
        return commentsPage.map(this::convertToCommentDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentDto> getRepliesForComment(Long commentId, int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 20);
        Sort sortOrder = Sort.by(Sort.Direction.ASC, "created");
        Pageable pageable = PageRequest.of(page, size, sortOrder);
        Page<CommentsEntity> repliesPage = commentsRepository.findRepliesDtoByParentId(commentId, pageable);
        return repliesPage.map(this::convertToCommentDto);
    }

    @Override
    @Transactional
    public CommentsEntity addCommentToEntity(String entityType, Long entityId, String text, UserEntity author) {
        return switch (entityType) {
            case "publication" -> addCommentToPublication(entityId, text, author);
            case "simpleEvent" -> addCommentToSimpleEvent(entityId, text, author);
            case "referendum" -> addCommentToReferendum(entityId, text, author);
            case "multiPoll" -> addCommentToMultiPoll(entityId, text, author);
            default -> throw new IllegalArgumentException("Invalid entity type: " + entityType);
        };
    }

    // ====== SPECIFIC МЕТОДИ ЗА ВСЕКИ ТИП ======

    @Override
    @Transactional(readOnly = true)
    public Page<CommentDto> getCommentsForSimpleEvent(Long simpleEventId, int page, int size, String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CommentsEntity> commentsPage = commentsRepository.findRootCommentsDtoByEventId(simpleEventId, pageable);
        return commentsPage.map(this::convertToCommentDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentDto> getCommentsForReferendum(Long referendumId, int page, int size, String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CommentsEntity> commentsPage = commentsRepository.findRootCommentsDtoByReferendumId(referendumId, pageable);
        return commentsPage.map(this::convertToCommentDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentDto> getCommentsForMultiPoll(Long multiPollId, int page, int size, String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CommentsEntity> commentsPage = commentsRepository.findRootCommentsDtoByMultiPollId(multiPollId, pageable);
        return commentsPage.map(this::convertToCommentDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentDto> getCommentsForPublication(Long publicationId, int page, int size, String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CommentsEntity> commentsPage = commentsRepository.findRootCommentsDtoByPublicationId(publicationId, pageable);
        return commentsPage.map(this::convertToCommentDto);
    }

    @Override
    @Transactional
    public CommentsEntity addCommentToSimpleEvent(Long simpleEventId, String text, UserEntity author) {
        SimpleEventEntity simpleEvent = simpleEventRepository.findById(simpleEventId)
                .orElseThrow(() -> new IllegalArgumentException("SimpleEvent not found with id: " + simpleEventId));

        CommentsEntity comment = new CommentsEntity();
        comment.setText(text);
        comment.setAuthor(author.getUsername());
        comment.setAuthorImage(author.getImageUrl());
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
        comment.setAuthorImage(author.getImageUrl());
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
        comment.setAuthorImage(author.getImageUrl());
        comment.setMultiPoll(multiPoll);
        comment.setLikeCount(0);
        comment.setUnlikeCount(0);
        comment.setCreated(Instant.now());
        comment.setEdited(false);

        return commentsRepository.save(comment);
    }

    @Override
    @Transactional
    public CommentsEntity addCommentToPublication(Long publicationId, String text, UserEntity author) {
        PublicationEntity publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new IllegalArgumentException("Publication not found with id: " + publicationId));

        CommentsEntity comment = new CommentsEntity();
        comment.setText(text);
        comment.setAuthor(author.getUsername());
        comment.setAuthorImage(author.getImageUrl());
        comment.setPublication(publication);
        comment.setLikeCount(0);
        comment.setUnlikeCount(0);
        comment.setCreated(Instant.now());
        comment.setEdited(false);

        return commentsRepository.save(comment);
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
    @Transactional(readOnly = true)
    public long countCommentsForPublication(Long publicationId) {
        return commentsRepository.countByPublicationId(publicationId);
    }

    // ====== СЪЩЕСТВУВАЩИ МЕТОДИ ======

    @Transactional
    @Override
    public CommentsEntity addComment(Long targetId, String author, String text, Long parentId, EventType targetType) {
        UserEntity user = userService.getCurrentUser();
        EventType eventType = getTargetType(targetId);

        CommentsEntity comment = new CommentsEntity();
        comment.setAuthor(user.getUsername());
        comment.setAuthorImage(user.getImageUrl());
        comment.setText(text);
        comment.setLikeCount(0);
        comment.setUnlikeCount(0);
        comment.setCreated(Instant.now());
        comment.setEdited(false);

        switch (eventType) {
            case REFERENDUM -> {
                ReferendumEntity referendum = referendumRepository.findById(targetId)
                        .orElseThrow(() -> new IllegalArgumentException("Referendum not found with ID: " + targetId));
                comment.setReferendum(referendum);
            }
            case SIMPLEEVENT -> {
                SimpleEventEntity event = simpleEventRepository.findById(targetId)
                        .orElseThrow(() -> new IllegalArgumentException("SimpleEvent not found with ID: " + targetId));
                comment.setEvent(event);
            }
            case MULTI_POLL -> {
                MultiPollEntity poll = multiPollRepository.findById(targetId)
                        .orElseThrow(() -> new IllegalArgumentException("MultiPoll not found with ID: " + targetId));
                comment.setMultiPoll(poll);
            }
            case PUBLICATION -> {
                PublicationEntity publication = publicationRepository.findById(targetId)
                        .orElseThrow(() -> new IllegalArgumentException("Publication not found with ID: " + targetId));
                comment.setPublication(publication);
            }
            default -> throw new UnsupportedOperationException("Unsupported target type: " + eventType);
        }

        if (parentId != null) {
            CommentsEntity parent = commentsRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            comment.setParent(parent);
        }

        return commentsRepository.save(comment);
    }

    @Retryable(interceptor = "commentRetryInterceptor")
    @Transactional
    @Override
    public CommentsEntity commentReaction(Long commentId, String type, String username) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Коментарът не е намерен"));

        CommentReactionType newReaction = "like".equalsIgnoreCase(type)
                ? CommentReactionType.LIKE
                : CommentReactionType.DISLIKE;

        Optional<CommentVoteEntity> existingVote = commentVoteRepository.findByCommentIdAndUsername(commentId, username);

        if (existingVote.isPresent()) {
            CommentVoteEntity vote = existingVote.get();
            if (vote.getReaction().equals(newReaction)) {
                // Remove vote if same reaction
                commentVoteRepository.delete(vote);
            } else {
                // Change reaction
                vote.setReaction(newReaction);
                commentVoteRepository.save(vote);
            }
        } else {
            // Add new vote
            CommentVoteEntity newVote = new CommentVoteEntity();
            newVote.setComment(comment);
            newVote.setUsername(username);
            newVote.setReaction(newReaction);
            comment.getVotes().add(newVote);
            commentVoteRepository.save(newVote);
        }

        // Update counters based on actual votes
        updateCommentCounters(comment);
        return commentsRepository.save(comment);
    }

    @Transactional(readOnly = true)
    @Override
    public String getUserReaction(Long commentId, String username) {
        return commentVoteRepository.findByCommentIdAndUsername(commentId, username)
                .map(vote -> vote.getReaction().name())
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentsEntity> getCommentsForTarget(Long targetId, EventType targetType) {
        return switch (targetType) {
            case REFERENDUM -> commentsRepository.findRootCommentsWithRepliesByReferendumId(targetId);
            case SIMPLEEVENT -> commentsRepository.findRootCommentsWithRepliesByEventId(targetId);
            case MULTI_POLL -> commentsRepository.findRootCommentsWithRepliesByMultiPollId(targetId);
            case PUBLICATION -> commentsRepository.findRootCommentsWithRepliesByPublicationId(targetId);
            default -> new ArrayList<>();
        };
    }

    @Override
    @Transactional(readOnly = true)
    public EventType getTargetType(Long id) {
        boolean isReferendum = referendumRepository.existsById(id);
        boolean isEvent = simpleEventRepository.existsById(id);
        boolean isMultiPoll = multiPollRepository.existsById(id);
        boolean isPublication = publicationRepository.existsById(id);

        int count = (isReferendum ? 1 : 0) + (isEvent ? 1 : 0) + (isMultiPoll ? 1 : 0) + (isPublication ? 1 : 0);

        if (count > 1) {
            throw new IllegalStateException("Conflict: ID съществува в повече от една таблица");
        } else if (isReferendum) {
            return EventType.REFERENDUM;
        } else if (isEvent) {
            return EventType.SIMPLEEVENT;
        } else if (isMultiPoll) {
            return EventType.MULTI_POLL;
        } else if (isPublication) {
            return EventType.PUBLICATION;
        } else {
            throw new IllegalArgumentException("Target ID not found: " + id);
        }
    }

    @Transactional
    @Override
    public CommentsEntity updateComment(Long commentId, String newText, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Коментарът не е намерен."));

        if (!canUserEditComment(commentId, user)) {
            throw new SecurityException("Нямате права за редактиране.");
        }

        comment.setText(newText);
        comment.setEdited(true);
        comment.setModified(Instant.now());
        return commentsRepository.save(comment);
    }

    @Transactional
    @Override
    public void deleteComment(Long commentId, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Коментарът не е намерен."));

        if (!canUserDeleteComment(commentId, user)) {
            throw new SecurityException("Нямате права за изтриване.");
        }

        commentsRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean commentExists(Long commentId) {
        return commentsRepository.existsById(commentId);
    }

    @Override
    @Transactional(readOnly = true)
    public CommentsEntity getCommentById(Long commentId) {
        return commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserEditComment(Long commentId, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId).orElse(null);
        return comment != null && canModifyComment(comment, user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserDeleteComment(Long commentId, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId).orElse(null);
        return comment != null && canModifyComment(comment, user);
    }

    @Override
    @Transactional
    public CommentsEntity addReplyToComment(Long parentCommentId, String text, UserEntity author) {
        CommentsEntity parentComment = commentsRepository.findById(parentCommentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));

        CommentsEntity reply = new CommentsEntity();
        reply.setText(text);
        reply.setAuthor(author.getUsername());
        reply.setAuthorImage(author.getImageUrl());
        reply.setParent(parentComment);
        reply.setLikeCount(0);
        reply.setUnlikeCount(0);
        reply.setCreated(Instant.now());
        reply.setEdited(false);

        // Set the same target entity as parent
        if (parentComment.getPublication() != null) {
            reply.setPublication(parentComment.getPublication());
        } else if (parentComment.getEvent() != null) {
            reply.setEvent(parentComment.getEvent());
        } else if (parentComment.getReferendum() != null) {
            reply.setReferendum(parentComment.getReferendum());
        } else if (parentComment.getMultiPoll() != null) {
            reply.setMultiPoll(parentComment.getMultiPoll());
        }

        return commentsRepository.save(reply);
    }

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
                // Remove vote if same reaction
                commentVoteRepository.delete(vote);
                comment.getVotes().remove(vote);
                userReaction = null;
            } else {
                // Change reaction
                vote.setReaction(reactionType);
                commentVoteRepository.save(vote);
                userReaction = reactionType.name();
            }
        } else {
            // Add new vote
            CommentVoteEntity newVote = new CommentVoteEntity();
            newVote.setComment(comment);
            newVote.setUsername(user.getUsername());
            newVote.setReaction(reactionType);
            comment.getVotes().add(newVote);
            commentVoteRepository.save(newVote);
            userReaction = reactionType.name();
        }

        // Update counters based on actual votes
        updateCommentCounters(comment);
        commentsRepository.save(comment);

        Map<String, Object> result = new HashMap<>();
        result.put("likeCount", comment.getLikeCount());
        result.put("dislikeCount", comment.getUnlikeCount());
        result.put("userReaction", userReaction);
        result.put("message", userReaction != null ? "Реакцията е записана" : "Реакцията е премахната");

        return result;
    }

    // ====== HELPER METHODS ======

    private boolean canModifyComment(@NotNull CommentsEntity comment, @NotNull UserEntity user) {
        return comment.getAuthor().equals(user.getUsername()) ||
                user.getRole().equals(UserRole.ADMIN);
    }

    @Transactional
    private Sort createSortForComments(String sortType) {
        return switch (sortType != null ? sortType.toLowerCase() : "newest") {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "created");
            case "newest" -> Sort.by(Sort.Direction.DESC, "created");
            case "likes" -> Sort.by(Sort.Direction.DESC, "likeCount");
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

    private CommentDto convertToCommentDto(CommentsEntity comment) {
        Long parentId = comment.getParent() != null ? comment.getParent().getId() : null;
        String entityType = null;
        Long entityId = null;

        if (comment.getPublication() != null) {
            entityType = "publication";
            entityId = comment.getPublication().getId();
        } else if (comment.getEvent() != null) {
            entityType = "simpleEvent";
            entityId = comment.getEvent().getId();
        } else if (comment.getReferendum() != null) {
            entityType = "referendum";
            entityId = comment.getReferendum().getId();
        } else if (comment.getMultiPoll() != null) {
            entityType = "multiPoll";
            entityId = comment.getMultiPoll().getId();
        }

        // Изчисляване на repliesCount с оптимизирана заявка
        long repliesCount = commentsRepository.countRepliesByParentId(comment.getId());

        return new CommentDto(
                comment.getId(),
                comment.getText(),
                comment.getCreated() != null ? comment.getCreated().toEpochMilli() : null,
                comment.getModified() != null ? comment.getModified().toEpochMilli() : null,
                comment.getAuthor(),
                comment.getAuthorImage(),
                false, // isOnline временно е false
                comment.getLikeCount(),
                comment.getUnlikeCount(),
                (int) repliesCount,
                parentId,
                entityType,
                entityId,
                comment.isEdited()
        );
    }
}