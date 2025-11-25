package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/multipoll")
public class MultiPollController {

    private final MultiPollService multiPollService;
    private final UserService userService;
    private final VoteService voteService;
    private final DeleteEventsService deleteEventsService;
    private final MultiPollRepository multiPollRepository;

    @Autowired
    public MultiPollController(MultiPollService multiPollService,
                               UserService userService,
                               VoteService voteService,
                               DeleteEventsService deleteEventsService,
                               MultiPollRepository multiPollRepository) {
        this.multiPollService = multiPollService;
        this.userService = userService;
        this.voteService = voteService;
        this.deleteEventsService = deleteEventsService;
        this.multiPollRepository = multiPollRepository;
    }

    @GetMapping("/createMultiPoll")
    public String showCreateForm(Model model) {
        if (!model.containsAttribute("createMultiPollView")) {
            CreateMultiPollView view = new CreateMultiPollView();
            view.setOptions(List.of("", ""));
            model.addAttribute("createMultiPollView", view);
        }
        model.addAttribute("locations", Locations.values());
        return "createMultiPoll";
    }



    @PostMapping("/create")
    public String createMultiPoll(@ModelAttribute CreateMultiPollView createMultiPollView,
                                  RedirectAttributes redirectAttributes) {

        boolean hasErrors = false;
        StringBuilder errorMessage = new StringBuilder();

        // Валидации
        if (createMultiPollView.getTitle() == null || createMultiPollView.getTitle().trim().isEmpty()) {
            errorMessage.append("Заглавието е задължително. ");
            hasErrors = true;
        }
        if (createMultiPollView.getDescription() == null || createMultiPollView.getDescription().trim().isEmpty()) {
            errorMessage.append("Описанието е задължително. ");
            hasErrors = true;
        }

        List<String> filteredOptions = createMultiPollView.getOptions().stream()
                .filter(opt -> opt != null && !opt.trim().isEmpty())
                .toList();

        if (filteredOptions.size() < 2) {
            errorMessage.append("Въведете поне две валидни опции.");
            hasErrors = true;
        } else if (filteredOptions.size() > 10) {
            errorMessage.append("Максимум 10 опции са разрешени.");
            hasErrors = true;
        }

        if (hasErrors) {
            redirectAttributes.addFlashAttribute("errorMessage", errorMessage.toString().trim());
            redirectAttributes.addFlashAttribute("createMultiPollView", createMultiPollView);
            return "redirect:/multipoll/createMultiPoll";
        }

        createMultiPollView.setOptions(filteredOptions);

        multiPollService.createMultiPoll(createMultiPollView);

        redirectAttributes.addFlashAttribute("successMessage", "Анкетата беше създадена успешно!");
        return "redirect:/multipoll/createMultiPoll";
    }


    @GetMapping("/{id}")
    public String showMultiPollDetail(@PathVariable Long id, Model model, jakarta.servlet.http.HttpServletRequest request) {
        try {
            MultiPollDetailViewDTO multiPollDetail = multiPollService.getMultiPollDetail(id);
            UserEntity currentUser = userService.getCurrentUser();

            // Проверка за Facebook bot
            String userAgent = request.getHeader("User-Agent");
            boolean isFacebookBot = userAgent != null && userAgent.contains("facebookexternalhit");

            if (isFacebookBot) {
                // ====== ЗА FACEBOOK BOT - ПОДГОТВИ OG ДАННИ ======
                String ogTitle = multiPollDetail.getTitle();
                if (ogTitle == null || ogTitle.trim().isEmpty()) {
                    ogTitle = "Анкета от SmolyanVote";
                }

                String ogDescription = multiPollDetail.getDescription();
                if (ogDescription != null && ogDescription.length() > 160) {
                    ogDescription = ogDescription.substring(0, 160) + "...";
                }
                if (ogDescription == null || ogDescription.trim().isEmpty()) {
                    ogDescription = "Участвайте в анкетата и споделете мнението си в SmolyanVote.";
                }

                String ogImage = null;
                if (multiPollDetail.getImageUrls() != null && !multiPollDetail.getImageUrls().isEmpty()) {
                    ogImage = multiPollDetail.getImageUrls().get(0);
                }
                if (ogImage == null || ogImage.trim().isEmpty()) {
                    ogImage = "https://smolyanvote.com/images/logoNew.png";
                } else if (ogImage.startsWith("/")) {
                    ogImage = "https://smolyanvote.com" + ogImage;
                }

                String ogUrl = "https://smolyanvote.com/multipoll/" + id;

                model.addAttribute("multiPoll", multiPollDetail);
                model.addAttribute("ogTitle", ogTitle);
                model.addAttribute("ogDescription", ogDescription);
                model.addAttribute("ogImage", ogImage);
                model.addAttribute("ogUrl", ogUrl);
                model.addAttribute("ogAuthor", multiPollDetail.getCreator().getUsername());

                return "multiPoll-social";
            } else {
                // ====== ЗА НОРМАЛНИ ПОТРЕБИТЕЛИ ======
                model.addAttribute("multiPoll", multiPollDetail);
                model.addAttribute("currentUser", currentUser);
                return "multiPollDetailView";
            }
        } catch (IllegalArgumentException e) {
            return "error/404";
        }
    }



    @PostMapping("/vote")
    public String submitVote(
            @RequestParam("multiPollId") Long pollId,
            @RequestParam("userEmail") String userEmail,
            @RequestParam("selectedOptions") List<Integer> selectedOptions,
            RedirectAttributes redirectAttributes) {

        try {
            // Извикваме service метода за обработка на гласа
            voteService.recordMultiPollVote(pollId, userEmail, selectedOptions);

            redirectAttributes.addFlashAttribute("successMessage", "Гласът ви беше записан успешно!");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Възникна грешка при записването на гласа.");
        }

        // Пренасочваме обратно към страницата с детайли за анкетата
        return "redirect:/multipoll/" + pollId;
    }

    @GetMapping("/{id}/edit")
    @PreAuthorize("hasRole('ADMIN')")
    public String showEditMultiPoll(@PathVariable Long id, Model model, RedirectAttributes redirectAttributes) {
        try {
            MultiPollDetailViewDTO multiPollDetail = multiPollService.getMultiPollDetail(id);
            CreateMultiPollView editView = new CreateMultiPollView();
            editView.setTitle(multiPollDetail.getTitle());
            editView.setDescription(multiPollDetail.getDescription());
            editView.setLocation(multiPollDetail.getLocation());
            editView.setOptions(multiPollDetail.getOptionsText());
            
            model.addAttribute("createMultiPollView", editView);
            model.addAttribute("pollId", id);
            model.addAttribute("locations", Locations.values());
            model.addAttribute("isEdit", true);
            model.addAttribute("existingImages", multiPollDetail.getImageUrls());
            
            return "createMultiPoll";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Анкетата не е намерена.");
            return "redirect:/mainEvents";
        }
    }

    @PostMapping("/{id}/edit")
    @PreAuthorize("hasRole('ADMIN')")
    public String updateMultiPoll(@PathVariable Long id,
                                 @ModelAttribute CreateMultiPollView createMultiPollView,
                                 RedirectAttributes redirectAttributes) {
        try {
            MultiPollEntity poll = multiPollRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Анкетата не е намерена"));

            // Обновяване на данните
            poll.setTitle(createMultiPollView.getTitle());
            poll.setDescription(createMultiPollView.getDescription());
            poll.setLocation(createMultiPollView.getLocation());

            // Обновяване на опциите
            List<String> filteredOptions = createMultiPollView.getOptions().stream()
                    .filter(opt -> opt != null && !opt.trim().isEmpty())
                    .toList();

            if (filteredOptions.size() < 2) {
                redirectAttributes.addFlashAttribute("errorMessage", "Въведете поне две валидни опции.");
                return "redirect:/multipoll/" + id;
            }

            // Задаване на опциите в ентитета
            poll.setOption1(filteredOptions.size() > 0 ? filteredOptions.get(0) : null);
            poll.setOption2(filteredOptions.size() > 1 ? filteredOptions.get(1) : null);
            poll.setOption3(filteredOptions.size() > 2 ? filteredOptions.get(2) : null);
            poll.setOption4(filteredOptions.size() > 3 ? filteredOptions.get(3) : null);
            poll.setOption5(filteredOptions.size() > 4 ? filteredOptions.get(4) : null);
            poll.setOption6(filteredOptions.size() > 5 ? filteredOptions.get(5) : null);
            poll.setOption7(filteredOptions.size() > 6 ? filteredOptions.get(6) : null);
            poll.setOption8(filteredOptions.size() > 7 ? filteredOptions.get(7) : null);
            poll.setOption9(filteredOptions.size() > 8 ? filteredOptions.get(8) : null);
            poll.setOption10(filteredOptions.size() > 9 ? filteredOptions.get(9) : null);

            multiPollRepository.save(poll);
            redirectAttributes.addFlashAttribute("successMessage", "Анкетата беше редактирана успешно!");
            return "redirect:/multipoll/" + id;

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при редактиране на анкетата: " + e.getMessage());
            return "redirect:/multipoll/" + id;
        }
    }

    @PostMapping("/multipoll/{id}/delete")
    public String deleteMultiPoll(@PathVariable Long id,
                                  RedirectAttributes redirectAttributes,
                                  Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Необходима е автентикация за изтриване.");
            return "redirect:/multipoll/" + id;
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();

            if (!deleteEventsService.canUserDeleteEvent(id, currentUser)) {
                redirectAttributes.addFlashAttribute("errorMessage", "Нямате права за изтриване на тази анкета.");
                return "redirect:/multipoll/" + id;
            }

            deleteEventsService.deleteEvent(id);
            redirectAttributes.addFlashAttribute("successMessage", "Анкетата беше изтрита успешно.");
            return "redirect:/mainEvents";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Възникна грешка при изтриването: " + e.getMessage());
            return "redirect:/multipoll/" + id;
        }
    }
}
