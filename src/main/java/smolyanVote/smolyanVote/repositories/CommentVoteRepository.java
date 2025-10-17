package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import smolyanVote.smolyanVote.models.CommentVoteEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;

import java.util.Optional;

public interface CommentVoteRepository extends JpaRepository<CommentVoteEntity, Long> {

    Optional<CommentVoteEntity> findByCommentIdAndUsername(Long commentId, String username);


    long countByCommentIdAndReaction(Long commentId, CommentReactionType commentReactionType);

    void deleteAllByCommentId(Long id);
}
