package smolyanVote.smolyanVote.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.services.interfaces.SitemapService;

/**
 * Контролер за генериране на Sitemap.xml
 * Endpoint: /sitemap.xml
 */
@RestController
public class SitemapController {

    private final SitemapService sitemapService;

    public SitemapController(SitemapService sitemapService) {
        this.sitemapService = sitemapService;
    }

    @GetMapping("/sitemap.xml")
    public ResponseEntity<String> getSitemap() {
        try {
            String sitemapXml = sitemapService.generateSitemapXml();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            headers.setCacheControl("public, max-age=3600"); // Кеширане за 1 час
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(sitemapXml);
        } catch (Exception e) {
            // В случай на грешка, връщаме празен sitemap
            String emptySitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" +
                    "  <url>\n" +
                    "    <loc>https://smolyanvote.com/</loc>\n" +
                    "  </url>\n" +
                    "</urlset>";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(emptySitemap);
        }
    }
}

