package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import smolyanVote.smolyanVote.models.ProfanityWordEntity;

import java.util.List;
import java.util.Optional;

public interface ProfanityWordRepository extends JpaRepository<ProfanityWordEntity, Long> {

    List<ProfanityWordEntity> findAllByOrderByWordAsc();

    List<ProfanityWordEntity> findByActiveTrueOrderByWordAsc();

    Optional<ProfanityWordEntity> findByWordIgnoreCase(String word);

    boolean existsByWordIgnoreCase(String word);
}
