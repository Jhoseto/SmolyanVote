package smolyanVote.smolyanVote.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Gemini API settings. Key is read from {@code gemini.api.key} / {@code GEMINI_API_KEY}
 * (src/main/resources/.env via spring-dotenv, or server environment in Docker).
 */
@Component
@ConfigurationProperties(prefix = "gemini")
public class GeminiProperties {

    private Api api = new Api();
    private Monitor monitor = new Monitor();

    public Api getApi() {
        return api;
    }

    public Monitor getMonitor() {
        return monitor;
    }

    public String resolvedApiKey() {
        String key = api.getKey();
        if (key == null || key.isBlank() || key.startsWith("${")) {
            String env = System.getenv("GEMINI_API_KEY");
            key = env != null ? env : "";
        }
        return key.trim();
    }

    public boolean isConfigured() {
        return !resolvedApiKey().isBlank();
    }

    public String resolvedModel() {
        String model = api.getModel();
        if (model == null || model.isBlank() || model.startsWith("${")) {
            String envModel = System.getenv("GEMINI_MODEL");
            model = (envModel != null && !envModel.isBlank()) ? envModel : "gemini-2.5-flash-lite";
        }
        return model.trim();
    }

    public String generateContentEndpoint() {
        String model = resolvedModel().replaceAll("[^a-zA-Z0-9._-]", "");
        return "https://generativelanguage.googleapis.com/v1beta/models/"
                + model
                + ":generateContent?key="
                + resolvedApiKey();
    }

    public static class Api {
        /** Populated from GEMINI_API_KEY in .env / environment. */
        private String key = "";

        /**
         * Batch-friendly model for summaries and translation.
         * Override with GEMINI_MODEL in .env (e.g. gemini-2.5-flash-lite).
         */
        private String model = "gemini-2.5-flash-lite";

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }
    }

    public static class Monitor {
        /**
         * For gemini-2.5-flash*: 0 disables thinking (faster/cheaper batch).
         * Ignored for *-flash-lite models.
         */
        private int thinkingBudget = 0;

        public int getThinkingBudget() {
            return thinkingBudget;
        }

        public void setThinkingBudget(int thinkingBudget) {
            this.thinkingBudget = thinkingBudget;
        }
    }
}
