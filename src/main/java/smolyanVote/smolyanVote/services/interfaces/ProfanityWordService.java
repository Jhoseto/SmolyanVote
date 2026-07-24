package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.ProfanityWordEntity;

import java.util.List;
import java.util.Map;

public interface ProfanityWordService {

    List<ProfanityWordEntity> listAll();

    ProfanityWordEntity addWord(String word);

    void deleteWord(Long id);

    void setActive(Long id, boolean active);

    void refreshCache();

    Map<String, Object> toAdminMap(ProfanityWordEntity entity);

    Map<String, Object> testText(String text);

    Map<String, Object> bulkImportWords(List<String> words);
}
