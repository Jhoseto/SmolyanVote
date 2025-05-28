package smolyanVote.smolyanVote.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.interceptor.RetryInterceptorBuilder;
import org.springframework.retry.interceptor.RetryOperationsInterceptor;



@Configuration
public class RetryConfig {

    @Bean
    public RetryOperationsInterceptor commentRetryInterceptor() {
        return RetryInterceptorBuilder.stateless()
                .maxAttempts(3)
                .backOffOptions(200, 2.0, 2000) // delay, multiplier, maxDelay
                .recoverer((r, t) -> {
                    throw new RuntimeException("Retry failed after 3 attempts", t);
                })
                .build();
    }
}
