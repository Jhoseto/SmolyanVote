package smolyanVote.smolyanVote.services.serviceImpl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;

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

    // 🌟 Метод за качване на снимка на множествена анкета (с воден знак)
    @Override
    public String saveMultiPollImage(MultipartFile file, Long pollId) {
        String publicId = "multipolls/poll_" + pollId + "/" + UUID.randomUUID();
        return uploadImage(file, publicId, "smolyanVote/multipolls/poll_" + pollId, true); // с воден знак
    }




    // 🌟 Общ метод за качване на изображение в Cloudinary
    @SuppressWarnings("unchecked")
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




}
