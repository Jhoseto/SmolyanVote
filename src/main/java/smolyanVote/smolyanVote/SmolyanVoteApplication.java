package smolyanVote.smolyanVote;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repository.EventRepository;
import smolyanVote.smolyanVote.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;


@SpringBootApplication
@EntityScan(basePackages = "smolyanVote.smolyanVote.models")
@EnableJpaRepositories(basePackages = "smolyanVote.smolyanVote.repository")

public class SmolyanVoteApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmolyanVoteApplication.class, args);
	}

}