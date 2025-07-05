package smolyanVote.smolyanVote.services.serviceImpl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.interfaces.ImageModerationService;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageCloudinaryServiceImpl implements ImageCloudinaryService {

    private final Cloudinary cloudinary;
    private final ImageModerationService imageModerationService;

    public ImageCloudinaryServiceImpl(@Value("${cloudinary.cloud_name}") String cloudName,
                                      @Value("${cloudinary.api_key}") String apiKey,
                                      @Value("${cloudinary.api_secret}") String apiSecret,
                                      ImageModerationService imageModerationService) {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
        this.imageModerationService = imageModerationService;
    }

    // 🌟 Метод за качване на потребителска снимка (без воден знак)
    @Override
    public String saveUserImage(MultipartFile file, String username) {
        String publicId = "users/user_" + username + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/users/user_" + username, false);
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



    // 🌟 Общ метод за качване на изображение в Cloudinary
    @SuppressWarnings("unchecked")
    private String uploadImage(MultipartFile file, String publicId, String folder, boolean addWatermark) {
        try {
            // 💾 ПЪРВО запазваме байтовете
            byte[] fileBytes = file.getBytes();

            // 🛡️ МОДЕРАЦИЯ ПЪРВО
            if (!imageModerationService.isFileSafe(fileBytes)) {
                throw new RuntimeException("⚠️ Изображението не премина модерацията");
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
}