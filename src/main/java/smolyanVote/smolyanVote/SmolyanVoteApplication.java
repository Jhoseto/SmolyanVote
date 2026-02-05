package smolyanVote.smolyanVote;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.retry.annotation.EnableRetry;

@EnableAspectJAutoProxy
@SpringBootApplication(scanBasePackages = { "smolyanVote.smolyanVote", "smolyanVote.virtualMajor" })
@EntityScan(basePackages = { "smolyanVote.smolyanVote.models", "smolyanVote.virtualMajor.models" })
@EnableJpaRepositories(basePackages = { "smolyanVote.smolyanVote.repositories",
		"smolyanVote.virtualMajor.repositories" })
@EnableRetry

public class SmolyanVoteApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmolyanVoteApplication.class, args);

	}
}