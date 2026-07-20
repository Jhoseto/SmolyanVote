package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * JSON заявка за {@code POST /api/v1/contact} — контракт за новия Next.js
 * frontend. Полетата и anti-spam правилата са 1:1 паритет с
 * {@link smolyanVote.smolyanVote.viewsAndDTO.ContactFormView}.
 */
public record ContactRequest(
        @NotBlank(message = "Името е задължително")
        @Size(min = 2, max = 50, message = "Името трябва да е между 2 и 50 символа")
        String name,

        @NotBlank(message = "Имейлът е задължителен")
        @Email(message = "Моля, въведете валиден имейл адрес")
        String email,

        @NotBlank(message = "Темата е задължителна")
        @Size(min = 3, max = 100, message = "Темата трябва да е между 3 и 100 символа")
        String subject,

        @NotBlank(message = "Съобщението е задължително")
        @Size(min = 10, max = 1000, message = "Съобщението трябва да е между 10 и 1000 символа")
        String message,

        /** Honeypot — трябва да остане празно; ботовете обикновено го попълват. */
        String middleName,

        /** Client timestamp (ms) кога формата е рендерирана — anti-spam минимално време. */
        long formRenderedAt
) {
}
