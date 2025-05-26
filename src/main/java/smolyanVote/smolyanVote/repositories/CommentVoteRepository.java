package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import smolyanVote.smolyanVote.models.CommentVoteEntity;

import java.util.Optional;

public interface CommentVoteRepository extends JpaRepository<CommentVoteEntity, Long> {

    Optional<CommentVoteEntity> findByCommentIdAndUsername(Long commentId, String username);
}
