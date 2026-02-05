package smolyanVote.virtualMajor.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration class for Virtual Major game module.
 * Defines necessary beans for the module.
 */
@Configuration
public class VirtualMajorConfig {

    /**
     * Bean for RestTemplate used by GeminiAIService to call Google Gemini API.
     *
     * @return a new RestTemplate instance
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
