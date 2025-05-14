package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.services.ImageStorageService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class ImageStorageServiceImpl implements ImageStorageService {

    // Задаваме новото място за записване на изображенията
    private final Path rootLocation = Paths.get("D:\\MyProjectsJAVA\\SmolyanVote\\imageStorage\\eventImages");
    private final Path rootReferendumLocation = Paths.get("D:\\MyProjectsJAVA\\SmolyanVote\\imageStorage\\referendumImages");

    public ImageStorageServiceImpl() {
        try {
            // Създаваме директорията, ако не съществува
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Неуспешно създаване на директория за снимки", e);
        }
    }

    @Override
    public String saveSingleImage(MultipartFile file, Long eventId) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            // Създаваме директорията за събитието, ако не съществува
            Path eventDir = rootLocation.resolve("event_" + eventId);
            Files.createDirectories(eventDir);

            // Генерираме уникално име за файла
            String filename = file.getOriginalFilename();
            assert filename != null;
            Path destinationFile = eventDir.resolve(filename).normalize();

            // Копираме файла в директорията
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            // Връщаме относителния URL
            return "/images/eventImages/event_" + eventId + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Неуспешно запазване на файл за събитие с ID: " + eventId, e);
        }
    }


    @Override
    public String saveSingleReferendumImage(MultipartFile file, Long referendumId) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            // Създаваме директорията за референдума
            Path referendumDir = rootReferendumLocation.resolve("referendum_" + referendumId);
            Files.createDirectories(referendumDir);

            // Генерираме уникално име за файла
            String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

            String extension = originalFilename.contains(".") ?
                    originalFilename.substring(originalFilename.lastIndexOf(".")) : "";

            String uniqueName = UUID.randomUUID().toString() + extension;
            Path destinationFile = referendumDir.resolve(uniqueName).normalize();

            // Копираме файла
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            // Връщаме правилен относителен URL
            return "/images/referendumImages/referendum_" + referendumId + "/" + uniqueName;
        } catch (IOException e) {
            throw new RuntimeException("Неуспешно запазване на файл за референдум с ID: " + referendumId, e);
        }
    }

}
