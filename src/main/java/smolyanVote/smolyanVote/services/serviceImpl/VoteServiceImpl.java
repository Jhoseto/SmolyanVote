package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.VoteService;


@Service
public class VoteServiceImpl implements VoteService {

    private final SimpleEventRepository simpleEventRepository;
    private final UserRepository userRepository;
    private final VoteSimpleEventRepository voteSimpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final VoteReferendumRepository voteReferendumRepository;

    @Autowired
    public VoteServiceImpl(SimpleEventRepository simpleEventRepository,
                           UserRepository userRepository,
                           VoteSimpleEventRepository voteSimpleEventRepository,
                           ReferendumRepository referendumRepository, VoteReferendumRepository voteReferendumRepository) {
        this.simpleEventRepository = simpleEventRepository;
        this.userRepository = userRepository;
        this.voteSimpleEventRepository = voteSimpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.voteReferendumRepository = voteReferendumRepository;
    }


    @Transactional
    @Override
    public void recordVote(Long eventId, String voteValue, String userEmail) {
        SimpleEventEntity event = simpleEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Събитие не е намерено"));
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен"));


        //TODO Проверка дали вече е гласувал
        if (voteSimpleEventRepository.existsByUserAndEvent(user, event)) {
            throw new IllegalStateException("Потребителят вече е гласувал за това събитие.");
        }


        VoteSimpleEventEntity vote = new VoteSimpleEventEntity();
        vote.setUser(user);
        vote.setEvent(event);
        vote.setVoteValue(voteValue);
        voteSimpleEventRepository.save(vote);


        switch (voteValue.toLowerCase()) {
            case "1":
                event.setYesVotes(event.getYesVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
                break;
            case "2":
                event.setNoVotes(event.getNoVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
                break;
            case "3":
                event.setNeutralVotes(event.getNeutralVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
                break;
            default:
                throw new IllegalArgumentException("Невалиден вот: " + voteValue);
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
        return voteReferendumRepository.findByUserIdAndReferendum_Id(userId,referendumId).orElse(null);
    }


    @Override
    public Integer findVoteByReferendumIdAndUserEmail(Long referendumId, String userEmail) {
        return voteSimpleEventRepository.findByEventIdAndUserEmail(referendumId, userEmail)
                .map(vote -> {
                    try {
                        return Integer.parseInt(vote.getVoteValue());
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .orElse(null);
    }







    @Override
    @Transactional
    public String recordReferendumVote(Long referendumId, String voteValue, String userEmail) {
        // Намери референдума
        ReferendumEntity referendum = referendumRepository.findReferendumById(referendumId)
                .orElseThrow(() -> new IllegalArgumentException("Референдумът не е намерен."));

        // Намери потребителя
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен."));

        // Провери дали вече е гласувал
        if (voteReferendumRepository.existsByUserAndReferendum(user, referendum)) {
            throw new IllegalStateException("Вече сте гласували в този референдум.");
        }

        // Преобразувай стойността на гласа до индекс (0-базиран)
        int voteIndex;
        try {
            voteIndex = Integer.parseInt(voteValue);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Невалиден вот.");
        }

        if (voteIndex < 0 || voteIndex > 9) {
            throw new IllegalArgumentException("Избрана е невалидна опция.");
        }

        // Актуализирай съответния брой гласове
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

        // Увеличи общия брой гласове
        referendum.setTotalVotes(referendum.getTotalVotes() + 1);
        user.setTotalVotes(user.getTotalVotes() +1);

        // Запази референдума
        userRepository.save(user);
        referendumRepository.save(referendum);

        // Запиши гласа
        VoteReferendumEntity vote = new VoteReferendumEntity();
        vote.setUser(user);
        vote.setReferendum(referendum);
        vote.setVoteValue(String.valueOf(voteIndex));
        voteReferendumRepository.save(vote);

        // Обнови броя гласове на потребителя
        user.setTotalVotes(user.getTotalVotes() + 1);
        userRepository.save(user);

        return "Гласът беше успешно отчетен.";
    }

}
