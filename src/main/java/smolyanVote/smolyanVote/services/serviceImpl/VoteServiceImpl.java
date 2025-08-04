package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.VoteService;

import java.util.List;

@Service
public class VoteServiceImpl implements VoteService {

    private final SimpleEventRepository simpleEventRepository;
    private final UserRepository userRepository;
    private final VoteSimpleEventRepository voteSimpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final VoteReferendumRepository voteReferendumRepository;
    private final MultiPollRepository multiPollRepository;
    private final VoteMultiPollRepository voteMultiPollRepository;

    @Autowired
    public VoteServiceImpl(SimpleEventRepository simpleEventRepository,
                           UserRepository userRepository,
                           VoteSimpleEventRepository voteSimpleEventRepository,
                           ReferendumRepository referendumRepository,
                           VoteReferendumRepository voteReferendumRepository,
                           MultiPollRepository multiPollRepository,
                           VoteMultiPollRepository voteMultiPollRepository) {
        this.simpleEventRepository = simpleEventRepository;
        this.userRepository = userRepository;
        this.voteSimpleEventRepository = voteSimpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.voteReferendumRepository = voteReferendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.voteMultiPollRepository = voteMultiPollRepository;
    }


    @Transactional
    @Override
    @LogActivity(action = ActivityActionEnum.VOTE_SIMPLE_EVENT, entityType = EventType.SIMPLEEVENT,
            entityIdParam = "eventId", details = "User: {userName}", includeChoice = true)

    public void recordSimpleEventVote(Long eventId, String voteValue, String userEmail) {
        SimpleEventEntity event = simpleEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Събитие не е намерено"));
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен"));

        if (voteSimpleEventRepository.existsByUserAndEvent(user, event)) {
            throw new IllegalStateException("Потребителят вече е гласувал за това събитие.");
        }

        VoteSimpleEventEntity vote = new VoteSimpleEventEntity();
        vote.setUser(user);
        vote.setEvent(event);
        vote.setVoteValue(voteValue);
        voteSimpleEventRepository.save(vote);

        switch (voteValue.toLowerCase()) {
            case "1" -> {
                event.setYesVotes(event.getYesVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
            }
            case "2" -> {
                event.setNoVotes(event.getNoVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
            }
            case "3" -> {
                event.setNeutralVotes(event.getNeutralVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
            }
            default -> throw new IllegalArgumentException("Невалиден вот: " + voteValue);
        }

        simpleEventRepository.save(event);

        user.setTotalVotes(user.getTotalVotes() + 1);
        userRepository.save(user);
    }


    @Override
    public VoteSimpleEventEntity findByUserIdAndEventId(Long userId, Long eventId) {
        return voteSimpleEventRepository.findByUserIdAndEventId(userId, eventId).orElse(null);
    }

    @Override
    public VoteReferendumEntity findByUserIdAndReferendumId(Long userId, Long referendumId) {
        return voteReferendumRepository.findByReferendum_IdAndUser_Id(userId, referendumId).orElse(null);
    }


    @Transactional
    @Override
    @LogActivity(action = ActivityActionEnum.VOTE_REFERENDUM, entityType = EventType.REFERENDUM,
            entityIdParam = "referendumId", details = "User: {userName}", includeChoice = true)

    public String recordReferendumVote(Long referendumId, String voteValue, String userEmail) {
        ReferendumEntity referendum = referendumRepository.findReferendumById(referendumId)
                .orElseThrow(() -> new IllegalArgumentException("Референдумът не е намерен."));
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен."));

        if (voteReferendumRepository.existsByUserAndReferendum(user, referendum)) {
            throw new IllegalStateException("Вече сте гласували в този референдум.");
        }

        int voteIndex;
        try {
            voteIndex = Integer.parseInt(voteValue);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Невалиден вот.");
        }

        if (voteIndex < 0 || voteIndex > 9) {
            throw new IllegalArgumentException("Избрана е невалидна опция.");
        }

        switch (voteIndex) {
            case 0 -> referendum.setVotes1(referendum.getVotes1() + 1);
            case 1 -> referendum.setVotes2(referendum.getVotes2() + 1);
            case 2 -> referendum.setVotes3(referendum.getVotes3() + 1);
            case 3 -> referendum.setVotes4(referendum.getVotes4() + 1);
            case 4 -> referendum.setVotes5(referendum.getVotes5() + 1);
            case 5 -> referendum.setVotes6(referendum.getVotes6() + 1);
            case 6 -> referendum.setVotes7(referendum.getVotes7() + 1);
            case 7 -> referendum.setVotes8(referendum.getVotes8() + 1);
            case 8 -> referendum.setVotes9(referendum.getVotes9() + 1);
            case 9 -> referendum.setVotes10(referendum.getVotes10() + 1);
        }

        referendum.setTotalVotes(referendum.getTotalVotes() + 1);
        user.setTotalVotes(user.getTotalVotes() + 1);

        userRepository.save(user);
        referendumRepository.save(referendum);

        VoteReferendumEntity vote = new VoteReferendumEntity();
        vote.setUser(user);
        vote.setReferendum(referendum);
        vote.setVoteValue(voteIndex);
        voteReferendumRepository.save(vote);

        return "Гласът беше успешно отчетен.";
    }


    @Transactional
    @Override
    @LogActivity(action = ActivityActionEnum.VOTE_MULTI_POLL, entityType = EventType.MULTI_POLL,
            entityIdParam = "pollId", details = "User: {userName}", includeChoice = true)

    public void recordMultiPollVote(Long pollId, String userEmail, List<Integer> selectedOptions) {
        if (selectedOptions == null || selectedOptions.isEmpty()) {
            throw new IllegalArgumentException("Трябва да изберете поне една опция.");
        }
        if (selectedOptions.size() > 3) {
            throw new IllegalArgumentException("Можете да изберете до 3 опции.");
        }

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен."));

        MultiPollEntity poll = multiPollRepository.findById(pollId)
                .orElseThrow(() -> new IllegalArgumentException("Анкетата не е намерена."));

        boolean alreadyVoted = voteMultiPollRepository.existsByMultiPollIdAndUserId(pollId, user.getId());
        if (alreadyVoted) {
            throw new IllegalArgumentException("Вече сте гласували в тази анкета.");
        }

        List<String> options = poll.getOptions();

        for (Integer optionIndex : selectedOptions) {
            if (optionIndex < 1 || optionIndex > options.size()) {
                throw new IllegalArgumentException("Избрана опция е невалидна.");
            }
            if (options.get(optionIndex - 1) == null) {
                throw new IllegalArgumentException("Избрана опция не съществува.");
            }
        }

        int optionsCounter = 0;
        for (Integer optionIndex : selectedOptions) {
            optionsCounter++;
            switch (optionIndex) {
                case 1 -> poll.setVotes1(poll.getVotes1() + 1);
                case 2 -> poll.setVotes2(poll.getVotes2() + 1);
                case 3 -> poll.setVotes3(poll.getVotes3() + 1);
                case 4 -> poll.setVotes4(poll.getVotes4() + 1);
                case 5 -> poll.setVotes5(poll.getVotes5() + 1);
                case 6 -> poll.setVotes6(poll.getVotes6() + 1);
                case 7 -> poll.setVotes7(poll.getVotes7() + 1);
                case 8 -> poll.setVotes8(poll.getVotes8() + 1);
                case 9 -> poll.setVotes9(poll.getVotes9() + 1);
                case 10 -> poll.setVotes10(poll.getVotes10() + 1);
            }
        }

        poll.setTotalVotes(poll.getTotalVotes() + optionsCounter);
        poll.setTotalUsersVotes(poll.getTotalUsersVotes() + 1);

        multiPollRepository.save(poll);

        for (Integer optionIndex : selectedOptions) {
            VoteMultiPollEntity vote = new VoteMultiPollEntity();
            vote.setMultiPoll(poll);
            vote.setUser(user);

            String optionText = poll.getOptions().get(optionIndex - 1);
            vote.setOptionText(optionText);

            voteMultiPollRepository.save(vote);
        }
    }
}
