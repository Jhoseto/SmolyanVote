package smolyanVote.smolyanVote.services.serviceImpl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.exceptions.ModerationViolationException;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.interfaces.ContentModerationService;
import smolyanVote.smolyanVote.services.interfaces.ImageModerationService;
import smolyanVote.smolyanVote.services.interfaces.UserBanService;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ImageCloudinaryServiceImpl implements ImageCloudinaryService {

    private static final Pattern TRUSTED_OAUTH_AVATAR_HOST = Pattern.compile(
            "(googleusercontent\\.com|graph\\.facebook\\.com|fbcdn\\.net|platform-lookaside\\.fbsbx\\.com)",
            Pattern.CASE_INSENSITIVE);

    private final Cloudinary cloudinary;
    private final ImageModerationService imageModerationService;
    private final ContentModerationService contentModerationService;

    public ImageCloudinaryServiceImpl(@Value("${cloudinary.cloud_name}") String cloudName,
                                      @Value("${cloudinary.api_key}") String apiKey,
                                      @Value("${cloudinary.api_secret}") String apiSecret,
                                      ImageModerationService imageModerationService,
                                      ContentModerationService contentModerationService) {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
        this.imageModerationService = imageModerationService;
        this.contentModerationService = contentModerationService;
    }

    // 🌟 Метод за качване на потребителска снимка (без воден знак)
    @Override
    public String saveUserImage(MultipartFile file, String username) {
        String publicId = "users/user_" + username + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/users/user_" + username, false);
    }

    @Override
    public String saveUserImageFromUrl(String imageUrl, String username) {
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("imageUrl is required");
        }
        if (!TRUSTED_OAUTH_AVATAR_HOST.matcher(imageUrl).find()) {
            throw new IllegalArgumentException("Untrusted OAuth avatar URL");
        }

        String publicId = "users/user_" + username + "/" + UUID.randomUUID();
        return uploadRemoteImage(imageUrl.trim(), publicId, "smolyanVote/users/user_" + username);
    }

    // 🌟 Метод за качване на снимка на събитие (с воден знак)
    @Override
    public String saveSingleImage(MultipartFile file, Long eventId) {
        String publicId = "events/event_" + eventId + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/events/event_" + eventId, true);
    }

    // 🌟 Метод за качване на снимка на референдум (с воден знак)
    @Override
    public String saveSingleReferendumImage(MultipartFile file, Long referendumId) {
        String publicId = "referendums/referendum_" + referendumId + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/referendums/referendum_" + referendumId, true);
    }

    // 🌟 Метод за качване на снимка на множествена анкета (с воден знак)
    @Override
    public String saveMultiPollImage(MultipartFile file, Long pollId) {
        String publicId = "multipolls/poll_" + pollId + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/multipolls/poll_" + pollId, true); // с воден знак
    }

    // 🌟 Метод за качване на снимка на публикация (БЕЗ воден знак)
    public String savePublicationImage(MultipartFile file, String username) {
        String publicId = "publications/user_" + username + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/publications/user_" + username, false);
    }

    // 🌟 Метод за качване на сигнал  (с воден знак)
    @Override
    public String saveSingleSignalImage(MultipartFile file, Long signalId) {
        String publicId = "signals/signal_" + signalId + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/signals/signal_" + signalId, true); // с воден знак
    }

    @Override
    public void deleteImage(String imageUrl) {
        try {
            // Извличаме public_id от URL-а
            String publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
        } catch (Exception e) {
            System.err.println("❌ Грешка при изтриване на снимка: " + e.getMessage());
        }
    }



    @SuppressWarnings("unchecked")
    private String uploadRemoteImage(String remoteUrl, String publicId, String folder) {
        try {
            Transformation transformation = new Transformation()
                    .width(512)
                    .height(512)
                    .crop("fill")
                    .gravity("face")
                    .quality("auto")
                    .fetchFormat("auto");

            Map<String, Object> uploadOptions = ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "transformation", transformation
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(remoteUrl, uploadOptions);
            return (String) uploadResult.get("secure_url");
        } catch (Exception e) {
            throw new RuntimeException("Failed to import OAuth avatar into Cloudinary", e);
        }
    }

    // 🌟 Общ метод за качване на изображение в Cloudinary
    @SuppressWarnings("unchecked")
    private String uploadImage(MultipartFile file, String publicId, String folder, boolean addWatermark) {
        try {
            // 💾 ПЪРВО запазваме байтовете
            byte[] fileBytes = file.getBytes();

            // 🛡️ МОДЕРАЦИЯ ПЪРВО
            if (!imageModerationService.isFileSafe(fileBytes)) {
                UserEntity currentUser = currentAuthenticatedUser();
                if (currentUser != null) {
                    contentModerationService.recordImageViolation(currentUser);
                }
                throw new ModerationViolationException(
                        "Снимката не премина модерацията и не може да бъде качена.",
                        ModerationViolationException.ViolationType.IMAGE,
                        0,
                        UserBanService.MAX_STRIKES_BEFORE_AUTO_BAN,
                        false,
                        null);
            }


            // Трансформации
            Transformation transformation = new Transformation()
                    .width(1000)
                    .crop("scale")
                    .quality("auto")
                    .fetchFormat("auto");

            if (addWatermark) {
                transformation.overlay("text:Arial_30:SmolyanVote.com")
                        .gravity("south")
                        .y(120)
                        .opacity(20)
                        .color("white")
                        .flags("relative");
            }

            Map<String, Object> uploadOptions = ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "transformation", transformation
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(fileBytes, uploadOptions);

            String finalUrl = (String) uploadResult.get("url");

            return finalUrl;

        } catch (ModerationViolationException e) {
            throw e;
        } catch (IOException e) {
            System.err.println("❌ IO Грешка: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to save image in Cloudinary", e);
        } catch (Exception e) {
            System.err.println("❌ Неочаквана грешка: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Грешка при quality на снимка", e);
        }
    }





    @Override
    public void deleteFolder(String folderPath) {
        try {
            // Изтриваме всички ресурси с дадения префикс
            cloudinary.api().deleteResourcesByPrefix(folderPath, ObjectUtils.emptyMap());

            // Изтриваме самата папка (подава се втори аргумент)
            cloudinary.api().deleteFolder(folderPath, ObjectUtils.emptyMap());
        } catch (Exception e) {
            System.err.println("Грешка при изтриване на папка от Cloudinary: " + e.getMessage());
        }
    }

    @Override
    public String savePodcastImage(MultipartFile file, Long episodeId) {
        String publicId = "podcasts/episode_" + episodeId + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/podcasts/episode_" + episodeId, false); // БЕЗ воден знак
    }

    // 🌟 Метод за качване на аудио файл на епизод (Cloudinary го третира като "video" ресурс)
    @SuppressWarnings("unchecked")
    @Override
    public String savePodcastAudio(MultipartFile file, Long episodeId) {
        try {
            String publicId = "podcasts/episode_" + episodeId + "/audio_" + UUID.randomUUID();
            Map<String, Object> uploadOptions = ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", "smolyanVote/podcasts/episode_" + episodeId,
                    "resource_type", "video" // Cloudinary няма отделен "audio" resource type
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadOptions);
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            System.err.println("❌ IO Грешка при качване на аудио: " + e.getMessage());
            throw new RuntimeException("Failed to save podcast audio in Cloudinary", e);
        } catch (Exception e) {
            System.err.println("❌ Неочаквана грешка при качване на аудио: " + e.getMessage());
            throw new RuntimeException("Грешка при качване на аудио файла", e);
        }
    }


    // Helper метод
    private String extractPublicIdFromUrl(String imageUrl) {
        try {
            // URL декодиране за %20 -> space
            String decodedUrl = java.net.URLDecoder.decode(imageUrl, StandardCharsets.UTF_8);

            if (decodedUrl.contains("/smolyanVote/")) {
                int startIndex = decodedUrl.indexOf("/smolyanVote/") + 1; // +1 за да включи smolyanVote/
                int endIndex = decodedUrl.lastIndexOf(".");
                if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
                    return decodedUrl.substring(startIndex, endIndex);
                }
            }
        } catch (Exception e) {
            System.err.println("Грешка при извличане на public_id: " + e.getMessage());
        }
        return null;
    }

    /** Avoids injecting {@code UserService} — breaks circular dependency with {@link UserServiceImpl}. */
    private static UserEntity currentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserEntity user) {
            return user;
        }
        return null;
    }
}