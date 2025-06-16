package smolyanVote.smolyanVote.viewsAndDTO;

import jakarta.validation.constraints.*;

/**
 * View model representing user registration information.
 * <p>
 * This view model contains the following fields:
 * <ul>
 *     <li><b>username:</b> The username for registration.</li>
 *     <li><b>email:</b> The email address for registration.</li>
 *     <li><b>regPassword:</b> The password for registration.</li>
 *     <li><b>confirmPassword:</b> The password confirmation field for registration.</li>
 *     <li><b>userModelConfirmationCode:</b> The confirmation code for user registration.</li>
 * </ul>
 */
public class UserRegistrationViewModel {


    @NotNull
    @Size(min = 5, max = 20, message = "Невалидно подребителско име! Въведете име с минимум 5 и максимум 20 символа.")
    private String username;

    @NotNull
    @Email(message = "Невалиден формат за Емейл!")
    private String email;

    @NotNull
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).+$", message = "Паролата трябва да съдържа поне 6 символа на латиница, една голяма буква и поне две цифри")
    private String regPassword;


    private String confirmPassword;


    @AssertTrue(message = "Грешка в повторението на паролата")
    public boolean isPasswordsMatch() {
        if (!regPassword.equals(confirmPassword)) {
            confirmPassword = null;
            return false;
        }
        return true;
    }


    private String userModelConfirmationCode;

    public String getUsername() {
        return username;
    }

    public UserRegistrationViewModel setUsername(String username) {
        this.username = username;
        return this;
    }

    public String getEmail() {
        return email;
    }

    public UserRegistrationViewModel setEmail(String email) {
        this.email = email;
        return this;
    }

    public String getRegPassword() {
        return regPassword;
    }

    public UserRegistrationViewModel setRegPassword(String regPassword) {
        this.regPassword = regPassword;
        return this;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public UserRegistrationViewModel setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
        return this;
    }

    public String getUserModelConfirmationCode() {
        return userModelConfirmationCode;
    }

    public UserRegistrationViewModel setUserModelConfirmationCode(String userModelConfirmationCode) {
        this.userModelConfirmationCode = userModelConfirmationCode;
        return this;
    }
}
