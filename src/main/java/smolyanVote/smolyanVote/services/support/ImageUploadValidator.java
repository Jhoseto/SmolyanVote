package smolyanVote.smolyanVote.services.support;

import org.apache.tika.Tika;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

/**
 * Shared multipart image checks for API controllers. Validates extension + file
 * content (Tika) instead of trusting the browser MIME type alone.
 */
@Component
public class ImageUploadValidator {

    public static final long MAX_EVENT_IMAGE_BYTES = 8L * 1024 * 1024;
    public static final long MAX_PUBLICATION_IMAGE_BYTES = 10L * 1024 * 1024;
    public static final long MAX_SIGNAL_IMAGE_BYTES = 5L * 1024 * 1024;

    private static final List<String> ALLOWED_IMAGE_MIME_TYPES =
            List.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS =
            List.of(".jpg", ".jpeg", ".png", ".gif", ".webp");

    private final Tika tika = new Tika();

    public void validateOptional(MultipartFile image, long maxBytes) {
        if (image == null || image.isEmpty()) {
            return;
        }
        validateRequired(image, maxBytes);
    }

    public void validateRequired(MultipartFile image, long maxBytes) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Не е избран файл.");
        }
        String originalFilename = Objects.requireNonNullElse(image.getOriginalFilename(), "").toLowerCase();
        if (ALLOWED_IMAGE_EXTENSIONS.stream().noneMatch(originalFilename::endsWith)) {
            throw new IllegalArgumentException("Файлът трябва да е .jpg, .jpeg, .png, .gif или .webp!");
        }
        if (image.getSize() > maxBytes) {
            long maxMb = Math.max(1, maxBytes / (1024 * 1024));
            throw new IllegalArgumentException("Файлът не трябва да надвишава " + maxMb + "MB!");
        }
        try {
            String detectedType = normalizeImageMime(tika.detect(image.getInputStream()));
            if (!isAllowedImageMime(detectedType)) {
                throw new IllegalArgumentException("Файлът не е валидно изображение (по съдържание)!");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Проблем при валидиране на файл: " + e.getMessage());
        }
    }

    private static boolean isAllowedImageMime(String mime) {
        return ALLOWED_IMAGE_MIME_TYPES.contains(normalizeImageMime(mime));
    }

    private static String normalizeImageMime(String mime) {
        if (mime == null || mime.isBlank()) {
            return "";
        }
        return switch (mime) {
            case "image/jpg", "image/pjpeg" -> "image/jpeg";
            default -> mime;
        };
    }
}
