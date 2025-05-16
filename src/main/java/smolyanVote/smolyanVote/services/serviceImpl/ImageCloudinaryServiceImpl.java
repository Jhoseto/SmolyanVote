package smolyanVote.smolyanVote.services.serviceImpl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.services.ImageCloudinaryService;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageCloudinaryServiceImpl implements ImageCloudinaryService {

    private final Cloudinary cloudinary;

    public ImageCloudinaryServiceImpl(@Value("${cloudinary.cloud_name}") String cloudName,
                                      @Value("${cloudinary.api_key}") String apiKey,
                                      @Value("${cloudinary.api_secret}") String apiSecret) {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
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

    // 🌟 Общ метод за качване на изображение в Cloudinary
    private String uploadImage(MultipartFile file, String publicId, String folder, boolean addWatermark) {
        try {
            // Основна трансформация
            Transformation transformation = new Transformation()
                    .width(1000)
                    .crop("scale")
                    .quality("auto")
                    .fetchFormat("auto");

            // Добавяне на воден знак, ако е необходимо
            if (addWatermark) {
                transformation.overlay("text:Arial_30:SmolyanVote.com")
                        .gravity("south")  // Позициониране по-близо до долната част
                        .y(120)             // Изместване малко нагоре
                        .opacity(20)       // Блед воден знак
                        .color("white")
                        .flags("relative");
            }

            // Качване в Cloudinary
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "transformation", transformation
            ));
            return (String) uploadResult.get("url");
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image in Cloudinary", e);
        }
    }

    // 🌟 Метод за изтриване на изображение от Cloudinary
    public void deleteImage(String imageUrl) {
        try {
            String publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
        } catch (IOException e) {
            System.err.println("Неуспешно изтриване на изображение от Cloudinary: " + e.getMessage());
        }
    }

    // 🌟 Извличане на public_id от URL на Cloudinary
    public String extractPublicIdFromUrl(String url) {
        try {
            int start = url.lastIndexOf("/") + 1;
            int end = url.lastIndexOf(".");
            return url.substring(start, end);
        } catch (Exception e) {
            System.err.println("Неуспешно извличане на public_id от URL: " + e.getMessage());
            return null;
        }
    }
}
