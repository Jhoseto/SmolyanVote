package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.PublicationStatus;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.SitemapService;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Имплементация на SitemapService
 * Генерира динамичен sitemap.xml с всички публични страници
 */
@Service
public class SitemapServiceImpl implements SitemapService {

    private static final String BASE_URL = "https://smolyanvote.com";
    private static final DateTimeFormatter W3C_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX")
            .withZone(ZoneId.of("Europe/Sofia"));

    private final PublicationRepository publicationRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;
    private final UserRepository userRepository;

    public SitemapServiceImpl(PublicationRepository publicationRepository,
                              SimpleEventRepository simpleEventRepository,
                              ReferendumRepository referendumRepository,
                              MultiPollRepository multiPollRepository,
                              UserRepository userRepository) {
        this.publicationRepository = publicationRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public String generateSitemapXml() {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"\n");
        xml.append("        xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n");
        xml.append("        xsi:schemaLocation=\"http://www.sitemaps.org/schemas/sitemap/0.9\n");
        xml.append("        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd\">\n\n");

        // Статични страници с висок приоритет
        addStaticPages(xml);

        // Публикации
        addPublications(xml);

        // Събития
        addSimpleEvents(xml);

        // Референдуми
        addReferendums(xml);

        // Анкети
        addMultiPolls(xml);

        // Публични потребителски профили
        addPublicUserProfiles(xml);

        xml.append("</urlset>");
        return xml.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllUrls() {
        List<String> urls = new ArrayList<>();

        // Статични страници
        urls.add(BASE_URL + "/");
        urls.add(BASE_URL + "/about");
        urls.add(BASE_URL + "/faq");
        urls.add(BASE_URL + "/terms-and-conditions");
        urls.add(BASE_URL + "/publications");
        urls.add(BASE_URL + "/mainEvents");
        urls.add(BASE_URL + "/signals/mainView");
        urls.add(BASE_URL + "/podcast");

        // Публикации
        List<PublicationEntity> publications = publicationRepository.findAll();
        for (PublicationEntity pub : publications) {
            if (pub.getStatus() == PublicationStatus.PUBLISHED || pub.getStatus() == PublicationStatus.EDITED) {
                urls.add(BASE_URL + "/publications/" + pub.getId());
            }
        }

        // Събития
        List<SimpleEventEntity> events = simpleEventRepository.findAll();
        for (SimpleEventEntity event : events) {
            urls.add(BASE_URL + "/event/" + event.getId());
        }

        // Референдуми
        List<ReferendumEntity> referendums = referendumRepository.findAll();
        for (ReferendumEntity ref : referendums) {
            urls.add(BASE_URL + "/referendum/" + ref.getId());
        }

        // Анкети
        List<MultiPollEntity> polls = multiPollRepository.findAll();
        for (MultiPollEntity poll : polls) {
            urls.add(BASE_URL + "/multipoll/" + poll.getId());
        }

        // Публични потребители
        List<UserEntity> users = userRepository.findAll();
        for (UserEntity user : users) {
            if (user.getUsername() != null && !user.getUsername().isEmpty()) {
                urls.add(BASE_URL + "/user/" + user.getUsername());
            }
        }

        return urls;
    }

    private void addStaticPages(StringBuilder xml) {
        Instant now = Instant.now();
        String lastmod = formatDate(now);

        // Главна страница - най-висок приоритет
        addUrl(xml, BASE_URL + "/", "1.0", "daily", lastmod);

        // Основни страници - висок приоритет
        addUrl(xml, BASE_URL + "/publications", "0.9", "daily", lastmod);
        addUrl(xml, BASE_URL + "/mainEvents", "0.9", "daily", lastmod);
        addUrl(xml, BASE_URL + "/signals/mainView", "0.8", "weekly", lastmod);
        addUrl(xml, BASE_URL + "/podcast", "0.8", "weekly", lastmod);

        // Информационни страници - среден приоритет
        addUrl(xml, BASE_URL + "/about", "0.7", "monthly", lastmod);
        addUrl(xml, BASE_URL + "/faq", "0.7", "monthly", lastmod);
        addUrl(xml, BASE_URL + "/terms-and-conditions", "0.5", "yearly", lastmod);
    }

    private void addPublications(StringBuilder xml) {
        List<PublicationEntity> publications = publicationRepository.findAll();
        for (PublicationEntity pub : publications) {
            // Само публикувани или редактирани публикации
            if (pub.getStatus() == PublicationStatus.PUBLISHED || pub.getStatus() == PublicationStatus.EDITED) {
                String url = BASE_URL + "/publications/" + pub.getId();
                String lastmod = formatDate(pub.getModified() != null ? pub.getModified() : pub.getCreated());
                // Публикациите са важни, но не толкова колкото главната страница
                addUrl(xml, url, "0.8", "weekly", lastmod);
            }
        }
    }

    private void addSimpleEvents(StringBuilder xml) {
        List<SimpleEventEntity> events = simpleEventRepository.findAll();
        for (SimpleEventEntity event : events) {
            String url = BASE_URL + "/event/" + event.getId();
            String lastmod = formatDate(event.getCreatedAt() != null ? event.getCreatedAt() : Instant.now());
            addUrl(xml, url, "0.8", "weekly", lastmod);
        }
    }

    private void addReferendums(StringBuilder xml) {
        List<ReferendumEntity> referendums = referendumRepository.findAll();
        for (ReferendumEntity ref : referendums) {
            String url = BASE_URL + "/referendum/" + ref.getId();
            String lastmod = formatDate(ref.getCreatedAt() != null ? ref.getCreatedAt() : Instant.now());
            addUrl(xml, url, "0.8", "weekly", lastmod);
        }
    }

    private void addMultiPolls(StringBuilder xml) {
        List<MultiPollEntity> polls = multiPollRepository.findAll();
        for (MultiPollEntity poll : polls) {
            String url = BASE_URL + "/multipoll/" + poll.getId();
            String lastmod = formatDate(poll.getCreatedAt() != null ? poll.getCreatedAt() : Instant.now());
            addUrl(xml, url, "0.8", "weekly", lastmod);
        }
    }

    private void addPublicUserProfiles(StringBuilder xml) {
        List<UserEntity> users = userRepository.findAll();
        for (UserEntity user : users) {
            if (user.getUsername() != null && !user.getUsername().isEmpty()) {
                String url = BASE_URL + "/user/" + user.getUsername();
                String lastmod = formatDate(user.getModified() != null ? user.getModified() : user.getCreated());
                // Потребителските профили са с по-нисък приоритет
                addUrl(xml, url, "0.6", "monthly", lastmod);
            }
        }
    }

    private void addUrl(StringBuilder xml, String loc, String priority, String changefreq, String lastmod) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(escapeXml(loc)).append("</loc>\n");
        xml.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        xml.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        xml.append("    <priority>").append(priority).append("</priority>\n");
        xml.append("  </url>\n\n");
    }

    private String formatDate(Instant instant) {
        if (instant == null) {
            instant = Instant.now();
        }
        return W3C_DATE_FORMAT.format(instant);
    }

    private String escapeXml(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&apos;");
    }
}

