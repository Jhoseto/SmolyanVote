package smolyanVote.smolyanVote.services.monitor;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Lightweight HTML extraction — no external parser dependency. */
final class MonitorZpokonpiHtmlParser {

    private static final Pattern TAG = Pattern.compile("<[^>]+>");
    private static final Pattern TD_CELL = Pattern.compile("<td[^>]*>([^<]{3,120})</td>", Pattern.CASE_INSENSITIVE);
    private static final Pattern HEADING = Pattern.compile("<h[1-6][^>]*>([^<]{3,120})</h[1-6]>", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINK_TEXT = Pattern.compile("<a[^>]+href=\"[^\"]+\"[^>]*>([^<]{3,120})</a>", Pattern.CASE_INSENSITIVE);
    private static final Pattern HREF = Pattern.compile("href=\"([^\"]+)\"", Pattern.CASE_INSENSITIVE);
    private static final Pattern CYRILLIC_NAME = Pattern.compile(
            "[А-ЯЁ][а-яё]+(?:[\\s\\-][А-ЯЁ][а-яё]+){1,3}");

    private MonitorZpokonpiHtmlParser() {
    }

    static Set<String> extractPersonNames(String html) {
        Set<String> names = new LinkedHashSet<>();
        if (html == null || html.isBlank()) {
            return names;
        }
        for (Pattern pattern : new Pattern[] {TD_CELL, HEADING, LINK_TEXT}) {
            Matcher matcher = pattern.matcher(html);
            while (matcher.find()) {
                addIfName(names, decode(matcher.group(1)));
            }
        }
        Matcher hrefMatcher = HREF.matcher(html);
        while (hrefMatcher.find()) {
            addIfName(names, decode(hrefMatcher.group(1)));
        }
        String plain = TAG.matcher(html).replaceAll(" ");
        Matcher nameMatcher = CYRILLIC_NAME.matcher(plain);
        while (nameMatcher.find()) {
            addIfName(names, nameMatcher.group());
        }
        return names;
    }

    static boolean looksLikeBotBlock(String html) {
        if (html == null) {
            return true;
        }
        String lower = html.toLowerCase();
        return lower.contains("cloudflare")
                || lower.contains("captcha_audio")
                || lower.contains("cf-browser-verification")
                || lower.contains("just a moment");
    }

    private static void addIfName(Set<String> names, String raw) {
        if (raw == null) {
            return;
        }
        String cleaned = raw
                .replace("<br />", " ")
                .replace("<br>", " ")
                .replace("&nbsp;", " ")
                .trim();
        if (cleaned.length() < 5 || cleaned.length() > 80) {
            return;
        }
        String lower = cleaned.toLowerCase();
        if (lower.contains("декларац")
                || lower.contains("изтегли")
                || lower.contains("pdf")
                || lower.contains("регистър")
                || lower.contains("общинск")
                || lower.contains("кмет на кметство")
                || lower.contains("http")) {
            // keep filename-style names like "Ф.Молайсенов.pdf"
            if (!cleaned.contains(".pdf") && !CYRILLIC_NAME.matcher(cleaned).find()) {
                return;
            }
        }
        Matcher matcher = CYRILLIC_NAME.matcher(cleaned);
        while (matcher.find()) {
            names.add(matcher.group().trim());
        }
        if (cleaned.contains(".pdf") || cleaned.contains(".doc")) {
            String fromFile = cleaned.replaceAll("(?i)\\.(pdf|docx?|xls[x]?).*", "").replace('_', ' ').trim();
            Matcher fileMatcher = CYRILLIC_NAME.matcher(fromFile);
            while (fileMatcher.find()) {
                names.add(fileMatcher.group().trim());
            }
        }
    }

    private static String decode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }
}
