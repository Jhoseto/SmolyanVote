package smolyanVote.smolyanVote.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Logs Gemini readiness at startup — helps verify .env / Docker env_file on deploy. */
@Component
public class GeminiStartupLogger {

    private static final Logger log = LoggerFactory.getLogger(GeminiStartupLogger.class);

    private final GeminiProperties geminiProperties;

    public GeminiStartupLogger(GeminiProperties geminiProperties) {
        this.geminiProperties = geminiProperties;
    }

    @PostConstruct
    void logStatus() {
        if (geminiProperties.isConfigured()) {
            String model = geminiProperties.resolvedModel();
            log.info(
                    "Gemini API ready — model={} (override via GEMINI_MODEL / gemini.api.model)",
                    model);
            if (model.contains("flash-lite")) {
                log.warn(
                        "Gemini model {} is deprecated for new API keys (404). "
                                + "Set GEMINI_MODEL=gemini-2.5-flash in .env and restart.",
                        model);
            }
        } else {
            log.warn(
                    "Gemini API key missing — set GEMINI_API_KEY in src/main/resources/.env or server .env. "
                            + "Monitor AI batch and messenger translation will use fallbacks/errors.");
        }
    }
}
