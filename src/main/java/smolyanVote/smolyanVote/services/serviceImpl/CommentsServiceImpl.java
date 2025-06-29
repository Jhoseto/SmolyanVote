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
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ReactionCountDto;

import java.time.Instant;
import java.util.*;

@Service
public class CommentsServiceImpl implements CommentsService {

    private static final Logger logger = LoggerFactory.getLogger(CommentsServiceImpl.class);

    private final CommentsRepository commentsRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final UserService userService;
    private final CommentVoteRepository commentVoteRepository;
    private final MultiPollRepository multiPollRepository;
    private final PublicationRepository publicationRepository;

    @Autowired
    public CommentsServiceImpl(CommentsRepository commentsRepository,
                               SimpleEventRepository simpleEventRepository,
                               ReferendumRepository referendumRepository,
                               UserService userService,
                               CommentVoteRepository commentVoteRepository,
                               MultiPollRepository multiPollRepository,
                               PublicationRepository publicationRepository) {
        this.commentsRepository = commentsRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.userService = userService;
        this.commentVoteRepository = commentVoteRepository;
        this.multiPollRepository = multiPollRepository;
        this.publicationRepository = publicationRepository;
    }

    @Transactional
    @Override
    public CommentsEntity addComment(Long targetId, String author, String text, Long parentId, EventType targetType) {
        UserEntity user = userService.getCurrentUser();

        EventType eventType = getTargetType(targetId);

        CommentsEntity comment = new CommentsEntity();
        comment.setAuthor(user.getUsername());
        comment.setAuthorImage(user.getImageUrl());
        comment.setText(text);
        comment.setCreatedAt(Instant.now());

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

        Optional<CommentVoteEntity> existingVoteOpt = commentVoteRepository.findByCommentIdAndUsername(commentId, username);

        if (existingVoteOpt.isPresent()) {
            CommentVoteEntity existingVote = existingVoteOpt.get();

            if (existingVote.getReaction() != newReaction) {
                // Промяна на гласа
                if (existingVote.getReaction() == CommentReactionType.LIKE) {
                    comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
                    comment.setUnlikeCount(comment.getUnlikeCount() + 1);
                } else {
                    comment.setUnlikeCount(Math.max(0, comment.getUnlikeCount() - 1));
                    comment.setLikeCount(comment.getLikeCount() + 1);
                }

                existingVote.setReaction(newReaction);
                commentVoteRepository.save(existingVote);
            }

        } else {
            // Нов глас
            CommentVoteEntity vote = new CommentVoteEntity();
            vote.setComment(comment);
            vote.setUsername(username);
            vote.setReaction(newReaction);
            commentVoteRepository.save(vote);

            if (newReaction == CommentReactionType.LIKE) {
                comment.setLikeCount(comment.getLikeCount() + 1);
            } else {
                comment.setUnlikeCount(comment.getUnlikeCount() + 1);
            }
        }

        return commentsRepository.save(comment);
    }

    @Transactional
    @Override
    public String getUserReaction(Long commentId, String username) {
        return commentVoteRepository.findByCommentIdAndUsername(commentId, username)
                .map(vote -> vote.getReaction().name()) // "LIKE" или "DISLIKE"
                .orElse(null);
    }

    @Transactional
    @Override
    public Map<Long, ReactionCountDto> getReactionsForAllCommentsWithReplies(List<CommentsEntity> comments, String username) {
        Map<Long, ReactionCountDto> reactionsMap = new HashMap<>();

        for (CommentsEntity comment : comments) {
            String userVote = username != null ? getUserReaction(comment.getId(), username) : null;
            ReactionCountDto reactionDto = new ReactionCountDto(
                    comment.getLikeCount(),
                    comment.getUnlikeCount(),
                    userVote
            );
            reactionsMap.put(comment.getId(), reactionDto);

            if (comment.getReplies() != null) {
                for (CommentsEntity reply : comment.getReplies()) {
                    userVote = username != null ? getUserReaction(reply.getId(), username) : null;
                    reactionDto = new ReactionCountDto(
                            reply.getLikeCount(),
                            reply.getUnlikeCount(),
                            userVote
                    );
                    reactionsMap.put(reply.getId(), reactionDto);
                }
            }
        }
        return reactionsMap;
    }

    @Transactional
    @Override
    public List<CommentsEntity> getCommentsForTarget(Long targetId, EventType targetType) {
        return switch (targetType) {
            case REFERENDUM -> commentsRepository.findRootCommentsWithRepliesByReferendumId(targetId);
            case SIMPLEEVENT -> commentsRepository.findRootCommentsWithRepliesByEventId(targetId);
            case MULTI_POLL -> commentsRepository.findRootCommentsWithRepliesByMultiPollId(targetId);
            case PUBLICATION -> commentsRepository.findRootCommentsWithRepliesByPublicationId(targetId);
            default -> new ArrayList<>();
        };
    }

    @Transactional
    @Override
    public EventType getTargetType(Long targetId) {
        boolean isReferendum = referendumRepository.existsById(targetId);
        boolean isEvent = simpleEventRepository.existsById(targetId);
        boolean isMultiPoll = multiPollRepository.existsById(targetId);
        boolean isPublication = publicationRepository.existsById(targetId);

        logger.debug("Checking target type for ID {}: referendum={}, event={}, multiPoll={}, publication={}",
                targetId, isReferendum, isEvent, isMultiPoll, isPublication);

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
            throw new IllegalArgumentException("Target ID not found: " + targetId);
        }
    }

    @Transactional
    @Override
    public void deleteAllComments() {
        commentsRepository.deleteAll();
    }

    @Transactional
    @Override
    public CommentsEntity editComment(Long commentId, String newText, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Коментарът не е намерен."));

        if (!canModifyComment(comment, user)) {
            throw new SecurityException("Нямате права за редактиране.");
        }

        comment.setText(newText);
        comment.setEdited(true);
        return commentsRepository.save(comment);
    }

    @Transactional
    @Override
    public void deleteComment(Long commentId, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Коментарът не е намерен."));

        if (!canModifyComment(comment, user)) {
            throw new SecurityException("Нямате права.");
        }

        commentsRepository.delete(comment);
    }

    // ====== НОВИТЕ МЕТОДИ ЗА ПУБЛИКАЦИИ ======

    @Transactional
    @Override
    public Page<CommentsEntity> getCommentsForPublication(Long publicationId, int page, int size, String sort) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);

        // Създаваме правилното сортиране
        Sort sortOrder = createSortForComments(sort);
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        return commentsRepository.findRootCommentsByPublicationId(publicationId, pageable);
    }

    @Transactional
    @Override
    public Page<CommentsEntity> getRepliesForComment(Long commentId, int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 20); // По-малко replies на страница

        // Replies винаги се сортират по дата създаване (най-стари първи)
        Sort sortOrder = Sort.by(Sort.Direction.ASC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        return commentsRepository.findRepliesByParentId(commentId, pageable);
    }

    @Transactional
    @Override
    public long countReplies(Long commentId) {
        return commentsRepository.countRepliesByCommentId(commentId);
    }

    @Transactional
    @Override
    public Page<CommentsEntity> getCommentsForTargetPaginated(Long targetId, EventType targetType, Pageable pageable) {
        return switch (targetType) {
            case PUBLICATION -> commentsRepository.findRootCommentsByPublicationId(targetId, pageable);
            case REFERENDUM -> throw new UnsupportedOperationException("Pagination not implemented for REFERENDUM");
            case SIMPLEEVENT -> throw new UnsupportedOperationException("Pagination not implemented for SIMPLEEVENT");
            case MULTI_POLL -> throw new UnsupportedOperationException("Pagination not implemented for MULTI_POLL");
            default -> Page.empty();
        };
    }

    // ====== HELPER METHODS ======

    private boolean canModifyComment(@NotNull CommentsEntity comment, @NotNull UserEntity user) {
        return comment.getAuthor().equals(user.getUsername()) ||
                user.getRole().equals(UserRole.ADMIN);
    }

    /**
     * Създава Sort обект за коментари според избрания тип сортиране
     */
    private Sort createSortForComments(String sortType) {
        return switch (sortType != null ? sortType.toLowerCase() : "newest") {
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "popular" -> {
                // Сортиране по популярност - комбинация от likes и dislikes
                yield Sort.by(Sort.Direction.DESC, "likeCount")
                        .and(Sort.by(Sort.Direction.DESC, "unlikeCount"));
            }
            case "longest" -> {
                // Сортиране по дължина на текста - най-дългите първи
                yield Sort.by(Sort.Direction.DESC, "text");
            }
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    // Recovery method за retry mechanism
    @Recover
    public CommentsEntity recoverFromDeadlock(Exception e, Long commentId, String type, String username) {
        logger.error("Failed to apply comment reaction after retries: {}", e.getMessage(), e);
        throw new RuntimeException("Системна грешка при запазване на реакцията. Моля, опитайте отново.");
    }
}