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

    @Override
    public void deleteImage(String imageUrl) {
        // Ако искаш, можеш да запазиш този метод, но за изтриване на папка няма да го ползваме
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



    // 🌟 Извличане на public_id от URL на Cloudinary
    public String extractPublicIdFromUrl(String url) {
        try {
            // Примерен URL част: .../upload/v1234567890/events/event_123/abcdefg.jpg
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) return null;

            // Взимаме частта след "/upload/"
            String pathAfterUpload = url.substring(uploadIndex + 8); // +8 = length("/upload/")

            // Премахваме версията, ако има (пример: v1234567890/)
            if (pathAfterUpload.startsWith("v")) {
                int slashAfterVersion = pathAfterUpload.indexOf("/");
                if (slashAfterVersion != -1) {
                    pathAfterUpload = pathAfterUpload.substring(slashAfterVersion + 1);
                }
            }

            // Премахваме разширението (.jpg, .png и т.н.)
            int dotIndex = pathAfterUpload.lastIndexOf('.');
            if (dotIndex != -1) {
                pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
            }

            return pathAfterUpload;
        } catch (Exception e) {
            System.err.println("Неуспешно извличане на public_id от URL: " + e.getMessage());
            return null;
        }
    }

}
