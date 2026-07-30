package smolyanVote.smolyanVote.services.monitor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.SignalsRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorRelatedSignalDTO;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class MonitorSignalsLinkService {

    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^\\p{L}\\p{N}]+");
    private static final Set<String> STOP_WORDS = Set.of(
            "община", "смолян", "договор", "поръчка", "изпълнение", "проект", "услуги",
            "работи", "доставка", "ремонт", "изграждане", "обект", "град", "село", "улица",
            "бул", "булевард", "площад", "район", "област", "фирма", "дружество", "лtd",
            "оод", "ead", "за", "при", "от", "на", "с", "и", "в", "по", "до", "без", "или");

    private final SignalsRepository signalsRepository;

    public MonitorSignalsLinkService(SignalsRepository signalsRepository) {
        this.signalsRepository = signalsRepository;
    }

    @Transactional(readOnly = true)
    public List<MonitorRelatedSignalDTO> findRelatedSignals(MonitorContractEntity contract, int limit) {
        String corpus = joinNonBlank(contract.getSubject(), contract.getShortSummary());
        List<String> keywords = extractKeywords(corpus, 6);
        if (keywords.isEmpty()) {
            return List.of();
        }

        Map<Long, ScoredSignal> matches = new LinkedHashMap<>();
        for (String keyword : keywords) {
            List<SignalsEntity> hits = signalsRepository.findActiveByTextMatch(
                    keyword, PageRequest.of(0, Math.min(limit * 2, 20)));
            for (SignalsEntity signal : hits) {
                int score = scoreMatch(keywords, signal);
                if (score <= 0) {
                    continue;
                }
                matches.merge(signal.getId(), new ScoredSignal(signal, score), (a, b) ->
                        b.score() > a.score() ? b : a);
            }
        }

        return matches.values().stream()
                .sorted(Comparator.comparingInt(ScoredSignal::score).reversed())
                .limit(Math.max(1, Math.min(limit, 15)))
                .map(s -> toDto(s.signal()))
                .toList();
    }

    @Transactional(readOnly = true)
    public int countRelatedSignals(MonitorContractEntity contract) {
        return findRelatedSignals(contract, 15).size();
    }

    private static int scoreMatch(List<String> keywords, SignalsEntity signal) {
        String haystack = joinNonBlank(signal.getTitle(), signal.getDescription()).toLowerCase(Locale.ROOT);
        int score = 0;
        for (String keyword : keywords) {
            if (haystack.contains(keyword.toLowerCase(Locale.ROOT))) {
                score += keyword.length() >= 6 ? 3 : 2;
            }
        }
        return score;
    }

    private static List<String> extractKeywords(String text, int max) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        Set<String> seen = new HashSet<>();
        List<String> result = new ArrayList<>();
        for (String raw : TOKEN_SPLIT.split(text.toLowerCase(Locale.ROOT))) {
            String token = raw.trim();
            if (token.length() < 4 || STOP_WORDS.contains(token) || seen.contains(token)) {
                continue;
            }
            seen.add(token);
            result.add(token);
            if (result.size() >= max) {
                break;
            }
        }
        return result;
    }

    private static MonitorRelatedSignalDTO toDto(SignalsEntity signal) {
        String snippet = signal.getDescription();
        if (snippet != null && snippet.length() > 120) {
            snippet = snippet.substring(0, 117) + "...";
        }
        return new MonitorRelatedSignalDTO(
                signal.getId(),
                signal.getTitle(),
                signal.getCategory() != null ? signal.getCategory().name() : null,
                snippet);
    }

    private static String joinNonBlank(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(part.trim());
            }
        }
        return sb.toString();
    }

    private record ScoredSignal(SignalsEntity signal, int score) {
    }
}
