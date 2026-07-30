package smolyanVote.smolyanVote.controllers.apiv1;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.services.monitor.MonitorNotFoundException;
import smolyanVote.smolyanVote.services.monitor.MonitorService;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/monitor")
public class MonitorController {

    private final MonitorService monitorService;

    public MonitorController(MonitorService monitorService) {
        this.monitorService = monitorService;
    }

    @GetMapping("/overview")
    public ResponseEntity<MonitorOverviewDTO> overview() {
        return ResponseEntity.ok(monitorService.getOverview());
    }

    @GetMapping("/feed")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> feed(
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(monitorService.getFeed(category, type, page, size));
    }

    @GetMapping("/feed/weekly")
    public ResponseEntity<List<MonitorFeedItemDTO>> weeklyHighlights() {
        return ResponseEntity.ok(monitorService.getWeeklyHighlights());
    }

    @GetMapping("/search")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(monitorService.search(q, page, size));
    }

    @GetMapping("/search/suggest")
    public ResponseEntity<List<MonitorSearchSuggestionDTO>> searchSuggest(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(monitorService.searchSuggest(q, limit));
    }

    @GetMapping("/procurement/stats")
    public ResponseEntity<MonitorProcurementStatsDTO> procurementStats() {
        return ResponseEntity.ok(monitorService.getProcurementStats());
    }

    @GetMapping("/procurement/anomalies")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> anomalies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(monitorService.getAnomalies(page, size));
    }

    @GetMapping("/procurement/flows")
    public ResponseEntity<MonitorFlowsDTO> flows() {
        return ResponseEntity.ok(monitorService.getFlows());
    }

    @GetMapping("/procurement/competition")
    public ResponseEntity<MonitorCompetitionDTO> competition() {
        return ResponseEntity.ok(monitorService.getCompetition());
    }

    @GetMapping("/procurement/regional-comparison")
    public ResponseEntity<MonitorRegionalComparisonDTO> regionalComparison() {
        return ResponseEntity.ok(monitorService.getRegionalComparison());
    }

    @GetMapping("/connections")
    public ResponseEntity<MonitorConnectionsDTO> connections() {
        return ResponseEntity.ok(monitorService.getConnections());
    }

    @GetMapping("/company/{eik}/connections")
    public ResponseEntity<MonitorConnectionsDTO> companyConnections(@PathVariable String eik) {
        return ResponseEntity.ok(monitorService.getCompanyConnections(eik));
    }

    @GetMapping("/company/{eik}")
    public ResponseEntity<?> company(@PathVariable String eik) {
        try {
            return ResponseEntity.ok(monitorService.getCompany(eik));
        } catch (MonitorNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/council/timeline")
    public ResponseEntity<List<MonitorFeedItemDTO>> councilTimeline() {
        return ResponseEntity.ok(monitorService.getCouncilTimeline());
    }

    @GetMapping("/council/stats")
    public ResponseEntity<MonitorCouncilStatsDTO> councilStats() {
        return ResponseEntity.ok(monitorService.getCouncilStats());
    }

    @GetMapping("/council/councilors")
    public ResponseEntity<List<MonitorCouncilorCardDTO>> councilors() {
        return ResponseEntity.ok(monitorService.getCouncilors());
    }

    @GetMapping("/budget")
    public ResponseEntity<MonitorBudgetDTO> budget() {
        return ResponseEntity.ok(monitorService.getBudget());
    }

    @GetMapping("/eu-funds")
    public ResponseEntity<MonitorEuFundsDTO> euFunds() {
        return ResponseEntity.ok(monitorService.getEuFunds());
    }

    @GetMapping("/contract/{id}")
    public ResponseEntity<?> contractDetail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(monitorService.getContract(id));
        } catch (MonitorNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/contract/{id}/related-signals")
    public ResponseEntity<List<MonitorRelatedSignalDTO>> contractRelatedSignals(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(monitorService.getContractRelatedSignals(id));
        } catch (MonitorNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/document/{id}")
    public ResponseEntity<?> documentDetail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(monitorService.getDocument(id));
        } catch (MonitorNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/deadlines")
    public ResponseEntity<List<MonitorFeedItemDTO>> deadlines() {
        return ResponseEntity.ok(monitorService.getDeadlines());
    }

    @GetMapping("/council")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> council(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(monitorService.getCouncilDocuments(page, size));
    }

    @GetMapping("/consultations")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> consultations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(monitorService.getConsultations(page, size));
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String, String>> categories() {
        return ResponseEntity.ok(Map.of(
                "procurement", "Поръчки",
                "council", "Общински съвет",
                "consultation", "Обсъждания"));
    }

    @ExceptionHandler(MonitorNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(MonitorNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }
}
