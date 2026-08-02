package smolyanVote.smolyanVote.controllers.apiv1;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.services.monitor.MonitorNotFoundException;
import smolyanVote.smolyanVote.services.monitor.MonitorScope;
import smolyanVote.smolyanVote.services.monitor.MonitorService;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.*;

import java.util.List;
import java.util.Map;

/**
 * Public monitor API.
 *
 * <p>Most endpoints take an optional {@code authority} EIK — the municipality picked in the
 * filter above the tabs. Omitting it means the whole oblast, and so does an unknown value.
 */
@RestController
@RequestMapping("/api/v1/monitor")
public class MonitorController {

    private final MonitorService monitorService;

    public MonitorController(MonitorService monitorService) {
        this.monitorService = monitorService;
    }

    @GetMapping("/municipalities")
    public ResponseEntity<List<MonitorMunicipalityDTO>> municipalities() {
        return ResponseEntity.ok(monitorService.getMunicipalities());
    }

    @GetMapping("/overview")
    public ResponseEntity<MonitorOverviewDTO> overview(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getOverview(MonitorScope.of(authority)));
    }

    @GetMapping("/feed")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> feed(
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "risk") String sort,
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getFeed(category, type, page, size, sort, MonitorScope.of(authority)));
    }

    @GetMapping("/briefing")
    public ResponseEntity<MonitorBriefingDTO> briefing(@RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getBriefing(MonitorScope.of(authority)));
    }

    @GetMapping("/feed/weekly")
    public ResponseEntity<List<MonitorFeedItemDTO>> weeklyHighlights(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getWeeklyHighlights(MonitorScope.of(authority)));
    }

    @GetMapping("/search")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.search(q, page, size, MonitorScope.of(authority)));
    }

    @GetMapping("/search/suggest")
    public ResponseEntity<List<MonitorSearchSuggestionDTO>> searchSuggest(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "8") int limit,
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.searchSuggest(q, limit, MonitorScope.of(authority)));
    }

    @GetMapping("/procurement/stats")
    public ResponseEntity<MonitorProcurementStatsDTO> procurementStats(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getProcurementStats(MonitorScope.of(authority)));
    }

    @GetMapping("/procurement/anomalies")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> anomalies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getAnomalies(page, size, MonitorScope.of(authority)));
    }

    @GetMapping("/procurement/flows")
    public ResponseEntity<MonitorFlowsDTO> flows(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getFlows(MonitorScope.of(authority)));
    }

    @GetMapping("/procurement/flows/path")
    public ResponseEntity<MonitorFlowPathDetailDTO> flowPath(
            @RequestParam String source,
            @RequestParam String target,
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getFlowPath(MonitorScope.of(authority), source, target));
    }

    @GetMapping("/procurement/competition")
    public ResponseEntity<MonitorCompetitionDTO> competition(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getCompetition(MonitorScope.of(authority)));
    }

    /** Deliberately unscoped: the whole point of the view is to compare the municipalities. */
    @GetMapping("/procurement/regional-comparison")
    public ResponseEntity<MonitorRegionalComparisonDTO> regionalComparison() {
        return ResponseEntity.ok(monitorService.getRegionalComparison());
    }

    @GetMapping("/connections")
    public ResponseEntity<MonitorConnectionsDTO> connections(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getConnections(MonitorScope.of(authority)));
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
    public ResponseEntity<List<MonitorFeedItemDTO>> councilTimeline(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getCouncilTimeline(MonitorScope.of(authority)));
    }

    @GetMapping("/council/stats")
    public ResponseEntity<MonitorCouncilStatsDTO> councilStats(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getCouncilStats(MonitorScope.of(authority)));
    }

    @GetMapping("/council/councilors")
    public ResponseEntity<List<MonitorCouncilorCardDTO>> councilors(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getCouncilors(MonitorScope.of(authority)));
    }

    @GetMapping("/budget")
    public ResponseEntity<MonitorBudgetDTO> budget(
            @RequestParam(required = false) String authority,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer yearFrom,
            @RequestParam(required = false) Integer yearTo) {
        return ResponseEntity.ok(monitorService.getBudget(MonitorScope.of(authority), year, yearFrom, yearTo));
    }

    @GetMapping("/eu-funds")
    public ResponseEntity<MonitorEuFundsDTO> euFunds(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getEuFunds(MonitorScope.of(authority)));
    }

    @GetMapping("/contract/{id}")
    public ResponseEntity<?> contractDetail(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean fresh) {
        try {
            return ResponseEntity.ok(monitorService.getContract(id, fresh));
        } catch (MonitorNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/official-budget/trend")
    public ResponseEntity<List<MonitorOfficialBudgetTrendPointDTO>> officialBudgetTrend() {
        return ResponseEntity.ok(monitorService.getOfficialBudgetTrend());
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
    public ResponseEntity<List<MonitorFeedItemDTO>> deadlines(
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getDeadlines(MonitorScope.of(authority)));
    }

    @GetMapping("/council")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> council(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getCouncilDocuments(page, size, MonitorScope.of(authority)));
    }

    @GetMapping("/consultations")
    public ResponseEntity<MonitorPageDTO<MonitorFeedItemDTO>> consultations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String authority) {
        return ResponseEntity.ok(monitorService.getConsultations(page, size, MonitorScope.of(authority)));
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
