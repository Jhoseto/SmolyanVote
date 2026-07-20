package smolyanVote.smolyanVote.services.support;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Plain HTML email templates from {@code classpath:email/} — no Thymeleaf.
 * Placeholders use {@code {{name}}} syntax.
 */
@Component
public class ClasspathHtmlTemplate {

    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    public String render(String classpathRelativePath, Map<String, String> variables) {
        String html = cache.computeIfAbsent(classpathRelativePath, this::load);
        String result = html;
        for (Map.Entry<String, String> e : variables.entrySet()) {
            String value = e.getValue() == null ? "" : e.getValue();
            result = result.replace("{{" + e.getKey() + "}}", value);
        }
        return result;
    }

    private String load(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                throw new IllegalStateException("Missing email template: " + path);
            }
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load email template: " + path, e);
        }
    }
}
