package smolyanVote.smolyanVote.viewsAndDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ContactFormView {
    @NotBlank
    private String name;
    @NotBlank @Email
    private String email;
    @NotBlank
    private String subject;
    @NotBlank
    private String message;


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
