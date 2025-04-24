package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.repository.CommentsRepository;
import smolyanVote.smolyanVote.repository.EventRepository;
import smolyanVote.smolyanVote.services.CommentsService;
import smolyanVote.smolyanVote.services.UserService;

import java.time.Instant;
import java.util.List;


@Service
public class CommentsServiceImpl implements CommentsService {
    private final CommentsRepository commentsRepository;
    private final EventRepository eventRepository;
    private final UserService userService;

    @Autowired
    public CommentsServiceImpl(CommentsRepository commentRepository,
                               EventRepository eventRepository,
                               UserService userService) {
        this.commentsRepository = commentRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
    }


    @Override
    public List<CommentsEntity> getCommentsForEvent(Long eventId) {
        return commentsRepository.findRootCommentsWithRepliesByEventId((eventId));
    }


    @Override
    public CommentsEntity addComment(Long eventId, String author, String text, Long parentId) {
        EventEntity event = eventRepository.findById(eventId).orElseThrow();
        CommentsEntity comment = new CommentsEntity();
        comment.setAuthor(userService.getCurrentUser().getUsername());
        comment.setAuthorImage(userService.getCurrentUser().getImageUrl());
        comment.setCreatedAt(Instant.now());
        comment.setText(text);
        comment.setEvent(event);

        if (parentId != null) {
            CommentsEntity parent = commentsRepository.findById(parentId).orElseThrow();
            comment.setParent(parent);
        }

        commentsRepository.save(comment);
        return comment;
    }

    @Override
    public void deleteAllComments() {
        commentsRepository.deleteAll();
    }
}
