package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.ReferendumService;
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
    public void recordSimpleEventVote(Long eventId, String voteValue, String userEmail) {
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
        return voteReferendumRepository.findByReferendum_IdAndUser_Id(userId,referendumId).orElse(null);
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
        vote.setVoteValue(voteIndex);
        voteReferendumRepository.save(vote);

        // Обнови броя гласове на потребителя
        user.setTotalVotes(user.getTotalVotes() + 1);
        userRepository.save(user);

        return "Гласът беше успешно отчетен.";
    }





    @Transactional
    @Override
    public void recordMultiPollVote(Long pollId, String userEmail, List<Integer> selectedOptions) {

        // 1. Проверка дали са избрани минимум 1 и максимум 3 опции
        if (selectedOptions == null || selectedOptions.isEmpty()) {
            throw new IllegalArgumentException("Трябва да изберете поне една опция.");
        }
        if (selectedOptions.size() > 3) {
            throw new IllegalArgumentException("Можете да изберете до 3 опции.");
        }

        // 2. Вземане на потребителя по имейл
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен."));

        // 3. Вземане на анкетата
        MultiPollEntity poll = multiPollRepository.findById(pollId)
                .orElseThrow(() -> new IllegalArgumentException("Анкетата не е намерена."));

        // 4. Проверка дали потребителят вече е гласувал в тази анкета
        boolean alreadyVoted = voteMultiPollRepository.existsByMultiPollIdAndUserId(pollId, user.getId());
        if (alreadyVoted) {
            throw new IllegalArgumentException("Вече сте гласували в тази анкета.");
        }

        // 5. Вземане на опциите (списък с текстове или null, ако опция няма)
        List<String> options = poll.getOptions();

        // 6. Проверка валидност на избраните опции спрямо броя опции и дали съществуват
        for (Integer optionIndex : selectedOptions) {
            if (optionIndex < 1 || optionIndex > options.size()) {
                throw new IllegalArgumentException("Избрана опция е невалидна.");
            }
            if (options.get(optionIndex - 1) == null) {
                throw new IllegalArgumentException("Избрана опция не съществува.");
            }
        }

        // 7. Запис на гласовете - за всяка избрана опция увеличаваме брояча в poll-а
        for (Integer optionIndex : selectedOptions) {
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

        // 8. Увеличаваме общия брой гласове
        poll.setTotalVotes(poll.getTotalVotes() + 1);

        // 9. Записваме анкетата с обновените гласове
        multiPollRepository.save(poll);

        // 10. Записваме гласа(овете) в таблицата с гласове (по един запис за всяка опция)
        for (Integer optionIndex : selectedOptions) {
            VoteMultiPollEntity vote = new VoteMultiPollEntity();
            vote.setMultiPoll(poll);
            vote.setUser(user);

            // Вземаме текста на опцията по индекса (опциите започват от 1, лист от 0)
            String optionText = poll.getOptions().get(optionIndex - 1);
            vote.setOptionText(optionText);

            voteMultiPollRepository.save(vote);
        }
    }
}
