package smolyanVote.smolyanVote.controllers;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.services.interfaces.ContactMessageService;
import smolyanVote.smolyanVote.viewsAndDTO.ContactFormView;

@Controller
public class ContactController {

    private static final Logger logger = LoggerFactory.getLogger(ContactController.class);
    private final ContactMessageService contactMessageService;

    @Autowired
    public ContactController(ContactMessageService contactMessageService) {
        this.contactMessageService = contactMessageService;
    }


    @GetMapping("/contacts")
    public String showContactForm(Model model) {
        if (!model.containsAttribute("contactForm")) {
            model.addAttribute("contactForm", new ContactFormView());
        }
        return "contacts_page";
    }

    @PostMapping("/contact")
    public String submitContactForm(@Valid @ModelAttribute("contactForm") ContactFormView contactFormView,
                                    BindingResult result,
                                    RedirectAttributes redirectAttributes) {
        // Проверка за honeypot
        if (contactFormView.getMiddleName() != null && !contactFormView.getMiddleName().isEmpty()) {
            logger.warn("Honeypot triggered: Possible bot submission from {}", contactFormView.getEmail());
            redirectAttributes.addFlashAttribute("error", "Изглежда, че сте бот. Моля, опитайте отново.");
            return "redirect:/contacts";
        }

        // Проверка за timestamp
        long formRenderedAt = contactFormView.getFormRenderedAt();
        long currentTime = System.currentTimeMillis();
        if (currentTime - formRenderedAt < 3000) { // 3 секунди минимално време
            logger.warn("Form submitted too quickly: {} ms", currentTime - formRenderedAt);
            redirectAttributes.addFlashAttribute("error", "Формата беше изпратена твърде бързо. Моля, опитайте отново.");
            return "redirect:/contacts";
        }

        // Проверка за валидация
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.contactForm", result);
            redirectAttributes.addFlashAttribute("contactForm", contactFormView);
            redirectAttributes.addFlashAttribute("error", "Моля, попълнете всички полета коректно.");
            return "redirect:/contacts";
        }

        try {
            // Запис на съобщението чрез сервиза
            contactMessageService.saveContactMessage(contactFormView);
            redirectAttributes.addFlashAttribute("successMessage", "Съобщението ви беше изпратено успешно!");
        } catch (Exception e) {
            logger.error("Error processing contact form: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", "Грешка при изпращане на съобщението. Моля, опитайте отново.");
        }

        return "redirect:/contacts";
    }
}