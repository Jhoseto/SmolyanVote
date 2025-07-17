package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.UserEntity;

public interface DeleteEventsService {

    void deleteEvent(Long eventId);

    boolean canUserDeleteEvent(Long eventId, UserEntity user);
}
