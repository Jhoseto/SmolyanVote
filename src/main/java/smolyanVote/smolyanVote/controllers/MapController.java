package smolyanVote.smolyanVote.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Контролер за интерактивната карта на SmolyanVote
 * Управлява страницата с интерактивната карта на събития
 */
@Controller
@RequestMapping("/map")
public class MapController {


    @GetMapping("/mainView")
    public String showMap(Model model) {
        // Добавяме основни данни за страницата
        model.addAttribute("pageTitle", "Интерактивна карта - SmolyanVote");
        model.addAttribute("metaDescription", "Интерактивна карта на всички събития и инициативи в град Смолян");

        // В бъдеще тук ще добавяме:
        // - Списък с всички събития от базата данни
        // - Настройки за картата
        // - Потребителски предпочитания

        return "smolyan-map";
    }

    /*
     * API endpoint за получаване на данни за картата (за бъдеще)
     * @return JSON с данни за събитията
     */
    // @GetMapping("/api/events")
    // @ResponseBody
    // public ResponseEntity<List<EventMapDTO>> getMapEvents() {
    //     // Ще се имплементира когато интегрираме с базата данни
    //     return ResponseEntity.ok(Collections.emptyList());
    // }
}