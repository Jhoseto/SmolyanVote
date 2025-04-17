package smolyanVote.smolyanVote.viewsAndDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * View model representing user login information.
 * <p>
 * This view model contains the following fields:
 * <ul>
 *     <li><b>email:</b> The email address used for login. Must not be null and must be a valid email format.</li>
 *     <li><b>password:</b> The password used for login. Must not be null and must have a minimum length of 6 characters.</li>
 *     <li><b>isActive:</b> Flag indicating whether the user account is active.</li>
 *     <li><b>rememberMe:</b> Flag indicating whether the user wants to be remembered (i.e., the "Remember Me" option).</li>
 * </ul>
 */
public class UserLoginViewModel {
    @NotNull
    @Email
    private String email;

    @NotNull
    @Size(min = 6)
    private String password;

    private boolean isActive;

    private boolean rememberMe;  // New field for "Remember Me" option

    public String getEmail() {
        return email;
    }

    public UserLoginViewModel setEmail(String email) {
        this.email = email;
        return this;
    }

    public String getPassword() {
        return password;
    }

    public UserLoginViewModel setPassword(String password) {
        this.password = password;
        return this;
    }

    public boolean isActive() {
        return isActive;
    }

    public UserLoginViewModel setActive(boolean active) {
        isActive = active;
        return this;
    }

    public boolean isRememberMe() {  // Getter for rememberMe
        return rememberMe;
    }

    public UserLoginViewModel setRememberMe(boolean rememberMe) {  // Setter for rememberMe
        this.rememberMe = rememberMe;
        return this;
    }
}
