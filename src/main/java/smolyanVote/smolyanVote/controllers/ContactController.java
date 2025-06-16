package smolyanVote.smolyanVote.controllers;

import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.viewsAndDTO.ContactFormView;

@Controller
public class ContactController {
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
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Моля, попълнете всички полета коректно.");
            return "redirect:/contacts";
        }
        // Логика за изпращане на съобщение (напр. имейл)
        redirectAttributes.addFlashAttribute("successMessage", "Съобщението ви беше изпратено успешно!");
        return "redirect:/contacts";
    }
}
