package smolyanVote.smolyanVote.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase Configuration за Push Notifications
 * Инициализира Firebase Admin SDK
 */
@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    @Value("${firebase.service-account-key:}")
    private String serviceAccountKeyPath;

    @PostConstruct
    public void initializeFirebase() {
        if (!firebaseEnabled) {
            log.info("Firebase is disabled - skipping initialization");
            return;
        }

        try {
            // Проверка дали Firebase вече е инициализиран
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = buildFirebaseOptions();
                FirebaseApp.initializeApp(options);
                log.info("✅ Firebase initialized successfully");
            } else {
                log.info("Firebase already initialized");
            }
        } catch (Exception e) {
            log.error("❌ Failed to initialize Firebase", e);
        }
    }

    private FirebaseOptions buildFirebaseOptions() throws IOException {
        FirebaseOptions.Builder builder = FirebaseOptions.builder();

        // Опит за зареждане на service account key
        InputStream serviceAccount = null;

        // Първо опитваме от файл път (environment variable или application.properties)
        if (serviceAccountKeyPath != null && !serviceAccountKeyPath.isEmpty()) {
            try {
                serviceAccount = new FileInputStream(serviceAccountKeyPath);
                log.info("Loading Firebase service account from: {}", serviceAccountKeyPath);
            } catch (IOException e) {
                log.warn("Could not load Firebase service account from path: {}", serviceAccountKeyPath);
            }
        }

        // Ако не е намерен от път, опитваме от classpath
        // (firebase-service-account.json)
        if (serviceAccount == null) {
            try {
                ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                if (resource.exists()) {
                    serviceAccount = resource.getInputStream();
                    log.info("Loading Firebase service account from classpath");
                }
            } catch (IOException e) {
                log.debug("Firebase service account not found in classpath");
            }
        }

        // Ако все още няма service account, опитваме от environment variable (JSON
        // string)
        if (serviceAccount == null) {
            String serviceAccountJson = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
            if (serviceAccountJson != null && !serviceAccountJson.isEmpty()) {
                try {
                    // Парсване на JSON string от environment variable
                    serviceAccount = new java.io.ByteArrayInputStream(serviceAccountJson.getBytes("UTF-8"));
                    log.info(
                            "Loading Firebase service account from FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
                } catch (Exception e) {
                    log.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {}", e.getMessage());
                }
            }
        }

        // Ако все още няма, опитваме от различни места
        if (serviceAccount == null) {
            String[] possiblePaths = {
                    // Absolute path based on project structure
                    System.getProperty("user.dir") + "/firebase-service-account.json",
                    System.getProperty("user.dir") + "/src/main/resources/firebase-service-account.json",
                    // Relative paths
                    "../SVMessengerMobile/firebase-service-account.json",
                    "SVMessengerMobile/firebase-service-account.json",
                    "./SVMessengerMobile/firebase-service-account.json",
                    "firebase-service-account.json",
                    "../firebase-service-account.json",
                    // Additional common locations
                    "src/main/resources/firebase-service-account.json",
                    "./src/main/resources/firebase-service-account.json"
            };

            log.info("🔍 Current working directory: {}", System.getProperty("user.dir"));
            log.info("🔍 Searching for firebase-service-account.json in {} locations...", possiblePaths.length);

            for (String path : possiblePaths) {
                try {
                    java.io.File firebaseFile = new java.io.File(path);
                    log.debug("Checking path: {} (absolute: {})", path, firebaseFile.getAbsolutePath());
                    if (firebaseFile.exists() && firebaseFile.isFile()) {
                        serviceAccount = new FileInputStream(firebaseFile);
                        log.info("✅ Loading Firebase service account from: {}", firebaseFile.getAbsolutePath());
                        break;
                    }
                } catch (Exception e) {
                    log.debug("Path not found: {} - {}", path, e.getMessage());
                    // Continue to next path
                }
            }
        }

        if (serviceAccount != null) {
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
            builder.setCredentials(credentials);
            serviceAccount.close();
        } else {
            // Ако няма service account, използваме default credentials (за Google Cloud)
            log.warn("No Firebase service account found - using default credentials (may not work)");
            builder.setCredentials(GoogleCredentials.getApplicationDefault());
        }

        return builder.build();
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        if (!firebaseEnabled) {
            return null;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                initializeFirebase();
            }
            return FirebaseMessaging.getInstance();
        } catch (Exception e) {
            log.error("Failed to create FirebaseMessaging instance", e);
            return null;
        }
    }
}
