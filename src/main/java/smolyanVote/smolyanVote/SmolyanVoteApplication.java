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



//
//
//package smolyanVote.smolyanVote;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.boot.SpringApplication;
//import org.springframework.boot.autoconfigure.SpringBootApplication;
//import smolyanVote.smolyanVote.models.EventEntity;
//import smolyanVote.smolyanVote.models.EventImageEntity;
//import smolyanVote.smolyanVote.models.UserEntity;
//import smolyanVote.smolyanVote.repository.EventRepository;
//import smolyanVote.smolyanVote.repository.UserRepository;
//
//import java.time.Instant;
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Optional;
//
//@SpringBootApplication
//public class SmolyanVoteApplication implements CommandLineRunner {
//
//	private final EventRepository eventRepository;
//	private final UserRepository userRepository;
//
//	@Autowired
//	public SmolyanVoteApplication(EventRepository eventRepository, UserRepository userRepository) {
//		this.eventRepository = eventRepository;
//		this.userRepository = userRepository;
//	}
//
//	public static void main(String[] args) {
//		SpringApplication.run(SmolyanVoteApplication.class, args);
//	}
//
//	@Override
//	public void run(String... args) throws Exception {
//
//		Optional<UserEntity> optionalUser = userRepository.findByEmail("konstantinse33@gmail.com");
//
//		if (optionalUser.isPresent()) {
//			UserEntity user = optionalUser.get();
//
//			// Създаване на събитието
//			EventEntity event = new EventEntity();
//			event.setTitle("За и Против отдаването на парко места с абонамент в основни пътни артерии в града");
//			event.setDescription("Това е тестово събитие, което ще се използва за проверка.");
//			event.setCreatorImage("/images/userPic1.png");
//			event.setCreatedAt(Instant.now());
//			event.setYesVotes(5);
//			event.setNoVotes(2);
//			event.setNeutralVotes(3);
//			event.setCreatorName(user.getUsername());
//			event.setCreatorImage(user.getImageUrl());
//
//			// Създаване на изображение и връзка със събитието
//			EventImageEntity image = new EventImageEntity();
//			image.setImageUrl("/images/zzz.jpg");
//			image.setEvent(event); // връзка към събитието
//
//			event.setImages(List.of(image)); // добавяме снимката в списъка
//
//			// Запис в базата
//			eventRepository.save(event);
//
//			System.out.println("Тестовото събитие беше успешно създадено и записано в базата данни.");
//		}
//	}
//}
