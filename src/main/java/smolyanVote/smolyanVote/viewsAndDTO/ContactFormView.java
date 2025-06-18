package smolyanVote.smolyanVote.viewsAndDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ContactFormView {
    @NotBlank(message = "Името е задължително")
    @Size(min = 2, max = 50, message = "Името трябва да е между 2 и 50 символа")
    private String name;

    @NotBlank(message = "Имейлът е задължителен")
    @Email(message = "Моля, въведете валиден имейл адрес")
    private String email;

    @NotBlank(message = "Темата е задължителна")
    @Size(min = 3, max = 100, message = "Темата трябва да е между 3 и 100 символа")
    private String subject;

    @NotBlank(message = "Съобщението е задължително")
    @Size(min = 10, max = 1000, message = "Съобщението трябва да е между 10 и 1000 символа")
    private String message;

    private String middleName; // Honeypot поле
    private long formRenderedAt; // Timestamp




    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public long getFormRenderedAt() { return formRenderedAt; }
    public void setFormRenderedAt(long formRenderedAt) { this.formRenderedAt = formRenderedAt; }
}