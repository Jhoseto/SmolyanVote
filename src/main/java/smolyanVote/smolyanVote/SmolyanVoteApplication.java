package smolyanVote.smolyanVote;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;


@SpringBootApplication
@EntityScan(basePackages = "smolyanVote.smolyanVote.models")
@EnableJpaRepositories(basePackages = "smolyanVote.smolyanVote.repositories")

public class SmolyanVoteApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmolyanVoteApplication.class, args);
	}

}