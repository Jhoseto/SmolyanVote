package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.exceptions.ModerationViolationException;
import smolyanVote.smolyanVote.models.UserEntity;

public interface ContentModerationService {

    void validateTextOrThrow(String text, UserEntity user, ModerationViolationException.ViolationType type);

    void recordImageViolation(UserEntity user);
}
