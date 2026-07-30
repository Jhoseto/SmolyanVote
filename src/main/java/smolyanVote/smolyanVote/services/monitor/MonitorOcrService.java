package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * OCR for scanned PDFs via external {@code tesseract} when installed on the host.
 * Documents with very short raw text and PDF source URLs are candidates.
 */
@Service
public class MonitorOcrService {

    private static final Logger log = LoggerFactory.getLogger(MonitorOcrService.class);
    private static final int MIN_TEXT_LEN = 80;

    private final MonitorDocumentRepository documentRepository;

    public MonitorOcrService(MonitorDocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    public boolean isTesseractAvailable() {
        try {
            Process p = new ProcessBuilder("tesseract", "--version").redirectErrorStream(true).start();
            return p.waitFor(5, TimeUnit.SECONDS) && p.exitValue() == 0;
        } catch (Exception ex) {
            return false;
        }
    }

    @Transactional
    public int processBatch(int limit) {
        List<MonitorDocumentEntity> candidates = documentRepository.findOcrCandidates(PageRequest.of(0, limit));
        int processed = 0;
        for (MonitorDocumentEntity doc : candidates) {
            try {
                if (runOcr(doc)) {
                    documentRepository.save(doc);
                    processed++;
                }
            } catch (Exception ex) {
                log.warn("OCR failed for document {}: {}", doc.getId(), ex.getMessage());
            }
        }
        return processed;
    }

    private boolean runOcr(MonitorDocumentEntity doc) throws Exception {
        String url = doc.getSourceUrl();
        if (url == null || !url.toLowerCase().contains(".pdf")) {
            return false;
        }
        if (!isTesseractAvailable()) {
            log.info("Tesseract not installed — skip OCR for document {}", doc.getId());
            return false;
        }

        Path tmpPdf = Files.createTempFile("monitor-ocr-", ".pdf");
        Path tmpTxt = Files.createTempFile("monitor-ocr-", ".txt");
        try {
            byte[] pdf = new org.springframework.web.client.RestTemplate().getForObject(url, byte[].class);
            if (pdf == null || pdf.length == 0) {
                return false;
            }
            Files.write(tmpPdf, pdf);

            Process p = new ProcessBuilder(
                    "tesseract",
                    tmpPdf.toAbsolutePath().toString(),
                    tmpTxt.toAbsolutePath().toString().replace(".txt", ""),
                    "-l", "bul")
                    .redirectErrorStream(true)
                    .start();
            if (!p.waitFor(120, TimeUnit.SECONDS) || p.exitValue() != 0) {
                return false;
            }

            Path outFile = Path.of(tmpTxt.toAbsolutePath().toString().replace(".txt", "") + ".txt");
            if (!Files.exists(outFile)) {
                return false;
            }
            String text = Files.readString(outFile, StandardCharsets.UTF_8).trim();
            if (text.length() < MIN_TEXT_LEN) {
                return false;
            }
            doc.setRawContent(text.length() > 50_000 ? text.substring(0, 50_000) : text);
            return true;
        } finally {
            Files.deleteIfExists(tmpPdf);
            Files.deleteIfExists(tmpTxt);
            Files.deleteIfExists(Path.of(tmpTxt.toAbsolutePath().toString().replace(".txt", "") + ".txt"));
        }
    }
}
