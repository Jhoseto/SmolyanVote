package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.exceptions.ModerationViolationException;
import smolyanVote.smolyanVote.models.ProfanityWordEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.ProfanityWordRepository;
import smolyanVote.smolyanVote.services.interfaces.ContentModerationService;
import smolyanVote.smolyanVote.services.interfaces.ProfanityWordService;
import smolyanVote.smolyanVote.services.interfaces.UserBanService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;

@Service
public class ContentModerationServiceImpl implements ContentModerationService, ProfanityWordService {

    private final ProfanityWordRepository profanityWordRepository;
    private final UserBanService userBanService;
    private final AtomicReference<List<String>> cachedWords = new AtomicReference<>(List.of());

    public ContentModerationServiceImpl(ProfanityWordRepository profanityWordRepository,
                                        UserBanService userBanService) {
        this.profanityWordRepository = profanityWordRepository;
        this.userBanService = userBanService;
    }

    @PostConstruct
    void init() {
        refreshCache();
    }

    @Override
    public void refreshCache() {
        cachedWords.set(
                profanityWordRepository.findByActiveTrueOrderByWordAsc().stream()
                        .map(ProfanityWordEntity::getWord)
                        .map(word -> word.toLowerCase(Locale.ROOT).trim())
                        .filter(word -> !word.isBlank())
                        .toList()
        );
    }

    @Override
    public void validateTextOrThrow(String text, UserEntity user, ModerationViolationException.ViolationType type) {
        if (text == null || text.isBlank()) {
            return;
        }

        String normalized = text.toLowerCase(Locale.ROOT);
        for (String word : cachedWords.get()) {
            if (containsWholeWord(normalized, word)) {
                throw buildViolation(user, type, profanityMessage(type));
            }
        }
    }

    @Override
    @Transactional
    public void recordImageViolation(UserEntity user) {
        throw buildViolation(user, ModerationViolationException.ViolationType.IMAGE, imageMessage());
    }

    private ModerationViolationException buildViolation(
            UserEntity user,
            ModerationViolationException.ViolationType type,
            String baseMessage) {
        UserBanService.StrikeResult strike = userBanService.recordModerationStrike(user, baseMessage);
        String message = strike.autoBanned()
                ? baseMessage + " След 3 предупреждения профилът ви е ограничен за 1 час — можете само да разглеждате."
                : baseMessage + " Профилът ви ще бъде прегледан за злонамерено поведение. Остават "
                + strike.strikesUntilBan() + " предупреждения преди временен бан.";

        return new ModerationViolationException(
                message,
                type,
                strike.strikeCount(),
                strike.strikesUntilBan(),
                strike.autoBanned(),
                strike.banEndDate());
    }

    private static String profanityMessage(ModerationViolationException.ViolationType type) {
        return switch (type) {
            case SPAM -> "Съдържанието изглежда като spam и не може да бъде публикувано.";
            default -> "Съдържанието съдържа нецензурни или неподходящи думи.";
        };
    }

    private static String imageMessage() {
        return "Снимката не премина модерацията и не може да бъде качена.";
    }

    private static boolean containsWholeWord(String haystack, String needle) {
        if (needle.isBlank()) {
            return false;
        }
        Pattern pattern = Pattern.compile("(?i)(?<![\\p{L}\\p{N}])" + Pattern.quote(needle) + "(?![\\p{L}\\p{N}])");
        return pattern.matcher(haystack).find();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProfanityWordEntity> listAll() {
        return profanityWordRepository.findAllByOrderByWordAsc();
    }

    @Override
    @Transactional
    public ProfanityWordEntity addWord(String word) {
        if (word == null || word.isBlank()) {
            throw new IllegalArgumentException("Думата не може да е празна.");
        }
        String normalized = word.trim().toLowerCase(Locale.ROOT);
        if (profanityWordRepository.existsByWordIgnoreCase(normalized)) {
            throw new IllegalStateException("Тази дума вече е в списъка.");
        }
        ProfanityWordEntity entity = new ProfanityWordEntity();
        entity.setWord(normalized);
        entity.setActive(true);
        entity.setCreatedAt(Instant.now());
        ProfanityWordEntity saved = profanityWordRepository.save(entity);
        refreshCache();
        return saved;
    }

    @Override
    @Transactional
    public void deleteWord(Long id) {
        profanityWordRepository.deleteById(id);
        refreshCache();
    }

    @Override
    @Transactional
    public void setActive(Long id, boolean active) {
        ProfanityWordEntity entity = profanityWordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Думата не е намерена."));
        entity.setActive(active);
        profanityWordRepository.save(entity);
        refreshCache();
    }

    @Override
    public Map<String, Object> toAdminMap(ProfanityWordEntity entity) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", entity.getId());
        map.put("word", entity.getWord());
        map.put("active", entity.isActive());
        map.put("createdAt", entity.getCreatedAt());
        return map;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> testText(String text) {
        Map<String, Object> result = new HashMap<>();
        if (text == null || text.isBlank()) {
            result.put("blocked", false);
            result.put("matches", List.of());
            return result;
        }
        String normalized = text.toLowerCase(Locale.ROOT);
        List<String> matches = cachedWords.get().stream()
                .filter(word -> containsWholeWord(normalized, word))
                .toList();
        result.put("blocked", !matches.isEmpty());
        result.put("matches", matches);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> bulkImportWords(List<String> words) {
        int added = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();
        if (words != null) {
            for (String word : words) {
                if (word == null || word.isBlank()) {
                    skipped++;
                    continue;
                }
                try {
                    addWord(word);
                    added++;
                } catch (RuntimeException e) {
                    skipped++;
                    errors.add(word + ": " + e.getMessage());
                }
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("added", added);
        result.put("skipped", skipped);
        result.put("errors", errors);
        return result;
    }
}
