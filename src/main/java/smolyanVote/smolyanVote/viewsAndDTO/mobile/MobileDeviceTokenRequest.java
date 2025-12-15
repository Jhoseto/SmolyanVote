package smolyanVote.smolyanVote.viewsAndDTO.mobile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO за регистрация на device token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MobileDeviceTokenRequest {

    @NotBlank(message = "Device token е задължителен")
    private String deviceToken;

    @NotBlank(message = "Platform е задължителен")
    @Pattern(regexp = "ios|android", message = "Platform трябва да е 'ios' или 'android'")
    private String platform;

    private String deviceId; // Optional
    private String appVersion; // Optional
}

