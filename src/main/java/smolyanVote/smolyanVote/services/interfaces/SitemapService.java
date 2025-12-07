package smolyanVote.smolyanVote.services.interfaces;

import java.util.List;

/**
 * Сервис за генериране на Sitemap.xml
 */
public interface SitemapService {
    
    /**
     * Генерира XML съдържание за sitemap
     * @return XML string за sitemap
     */
    String generateSitemapXml();
    
    /**
     * Връща списък с всички URL-и за sitemap
     * @return List от URL strings
     */
    List<String> getAllUrls();
}

