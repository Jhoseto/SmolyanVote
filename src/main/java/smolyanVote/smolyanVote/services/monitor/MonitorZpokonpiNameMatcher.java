package smolyanVote.smolyanVote.services.monitor;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Fuzzy Bulgarian person-name matching for roster / register cross-checks. */
final class MonitorZpokonpiNameMatcher {

    private static final Pattern NON_LETTERS = Pattern.compile("[^\\p{L}]+");
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");
    private static final Set<String> TITLE_TOKENS = Set.of(
            "инж", "инж.", "д-р", "др", "доц", "доц.", "prof", "проф", "г-н", "г-жа", "господин", "госпожа");

    private MonitorZpokonpiNameMatcher() {
    }

    static boolean matches(String expected, String candidate) {
        if (expected == null || candidate == null) {
            return false;
        }
        Set<String> expectedTokens = tokens(expected);
        Set<String> candidateTokens = tokens(candidate);
        if (expectedTokens.isEmpty() || candidateTokens.isEmpty()) {
            return false;
        }
        if (candidateTokens.containsAll(expectedTokens)) {
            return true;
        }
        String expectedLast = lastToken(expectedTokens);
        String candidateLast = lastToken(candidateTokens);
        if (expectedLast == null || candidateLast == null) {
            return false;
        }
        if (!expectedLast.equals(candidateLast) && !expectedLast.startsWith(candidateLast.substring(0, Math.min(4, candidateLast.length())))) {
            return false;
        }
        long overlap = expectedTokens.stream().filter(candidateTokens::contains).count();
        return overlap >= 2 || (overlap >= 1 && expectedTokens.size() <= 2);
    }

    static boolean appearsInText(String fullName, String haystack) {
        if (fullName == null || haystack == null || haystack.isBlank()) {
            return false;
        }
        String normalizedHay = normalize(haystack);
        for (String token : tokens(fullName)) {
            if (token.length() >= 4 && normalizedHay.contains(token)) {
                return true;
            }
        }
        return normalizedHay.contains(normalize(fullName));
    }

    static Set<String> tokens(String name) {
        return Arrays.stream(normalize(name).split(" "))
                .filter(t -> t.length() > 1)
                .filter(t -> !TITLE_TOKENS.contains(t))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static String lastToken(Set<String> tokens) {
        String last = null;
        for (String token : tokens) {
            last = token;
        }
        return last;
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String n = Normalizer.normalize(value, Normalizer.Form.NFC)
                .toLowerCase(Locale.ROOT)
                .replace('ё', 'е');
        n = NON_LETTERS.matcher(n).replaceAll(" ");
        n = MULTI_SPACE.matcher(n).replaceAll(" ").trim();
        return n;
    }
}
