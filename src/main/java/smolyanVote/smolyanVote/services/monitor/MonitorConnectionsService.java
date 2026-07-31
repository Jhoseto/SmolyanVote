package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorConnectionsDTO;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MonitorConnectionsService {

    private static final int TOP_CONTRACTORS = 12;

    private final MonitorContractRepository contractRepository;
    private final ObjectMapper objectMapper;

    public MonitorConnectionsService(MonitorContractRepository contractRepository, ObjectMapper objectMapper) {
        this.contractRepository = contractRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public MonitorConnectionsDTO buildConnectionsGraph(MonitorScope scope) {
        List<MonitorContractEntity> contracts = contractRepository.findAllInScope(scope.authorityFilter());
        Map<String, BigDecimal> contractorTotals = new HashMap<>();
        Map<String, String> contractorLabels = new HashMap<>();
        Map<String, List<MonitorContractEntity>> contractorContracts = new HashMap<>();

        for (MonitorContractEntity c : contracts) {
            if (c.getAmountEur() == null || c.getContractorEik() == null) {
                continue;
            }
            String id = "co:" + c.getContractorEik();
            contractorLabels.putIfAbsent(id, c.getContractorName() != null ? c.getContractorName() : c.getContractorEik());
            contractorTotals.merge(id, c.getAmountEur(), BigDecimal::add);
            contractorContracts.computeIfAbsent(id, k -> new ArrayList<>()).add(c);
        }

        Set<String> topContractorIds = contractorTotals.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue(Comparator.reverseOrder()))
                .limit(TOP_CONTRACTORS)
                .map(Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toSet());

        Map<String, BigDecimal> authorityTotals = new HashMap<>();
        Map<String, String> authorityLabels = new HashMap<>();
        Map<String, Long> linkCounts = new HashMap<>();
        Map<String, BigDecimal> linkValues = new HashMap<>();

        for (MonitorContractEntity c : contracts) {
            if (c.getAmountEur() == null || c.getContractorEik() == null) {
                continue;
            }
            String contractorId = "co:" + c.getContractorEik();
            if (!topContractorIds.contains(contractorId)) {
                continue;
            }
            String authId = "auth:" + c.getAuthorityEik();
            authorityLabels.putIfAbsent(authId, c.getAuthorityName() != null ? c.getAuthorityName() : c.getAuthorityEik());
            authorityTotals.merge(authId, c.getAmountEur(), BigDecimal::add);

            String linkKey = authId + "->" + contractorId;
            linkCounts.merge(linkKey, 1L, Long::sum);
            linkValues.merge(linkKey, c.getAmountEur(), BigDecimal::add);
        }

        Set<String> nodeIds = new HashSet<>();
        nodeIds.addAll(authorityTotals.keySet());
        nodeIds.addAll(topContractorIds);

        Map<String, Integer> nodeLinkCounts = new HashMap<>();
        for (String linkKey : linkValues.keySet()) {
            String[] parts = linkKey.split("->");
            nodeLinkCounts.merge(parts[0], 1, Integer::sum);
            nodeLinkCounts.merge(parts[1], 1, Integer::sum);
        }

        List<MonitorConnectionsDTO.ConnectionNodeDTO> nodes = nodeIds.stream()
                .map(id -> {
                    BigDecimal total = id.startsWith("auth:")
                            ? authorityTotals.getOrDefault(id, BigDecimal.ZERO)
                            : contractorTotals.getOrDefault(id, BigDecimal.ZERO);
                    String label = id.startsWith("auth:")
                            ? authorityLabels.getOrDefault(id, id)
                            : contractorLabels.getOrDefault(id, id);
                    if (id.startsWith("auth:")) {
                        return new MonitorConnectionsDTO.ConnectionNodeDTO(
                                id, label, "authority", total, nodeLinkCounts.getOrDefault(id, 0), 0, null);
                    }
                    MonitorFlowHintBuilder.FlowHint hint = MonitorFlowHintBuilder.forContracts(
                            contractorContracts.getOrDefault(id, List.of()), objectMapper);
                    return new MonitorConnectionsDTO.ConnectionNodeDTO(
                            id,
                            label,
                            "contractor",
                            total,
                            nodeLinkCounts.getOrDefault(id, 0),
                            hint.flaggedCount(),
                            hint.citizenHint());
                })
                .sorted(Comparator.comparing(MonitorConnectionsDTO.ConnectionNodeDTO::totalEur).reversed())
                .toList();

        List<MonitorConnectionsDTO.ConnectionLinkDTO> links = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : linkValues.entrySet()) {
            String[] parts = entry.getKey().split("->");
            links.add(new MonitorConnectionsDTO.ConnectionLinkDTO(
                    parts[0], parts[1], entry.getValue(), linkCounts.getOrDefault(entry.getKey(), 0L)));
        }
        links.sort(Comparator.comparing(MonitorConnectionsDTO.ConnectionLinkDTO::valueEur).reversed());

        return new MonitorConnectionsDTO(nodes, links);
    }

    /** A company's ties are shown across the whole oblast — that is the point of the view. */
    @Transactional(readOnly = true)
    public MonitorConnectionsDTO buildCompanyConnections(String contractorEik) {
        MonitorConnectionsDTO full = buildConnectionsGraph(MonitorScope.WHOLE_OBLAST);
        String companyId = "co:" + contractorEik.trim();
        List<MonitorConnectionsDTO.ConnectionLinkDTO> links = full.links().stream()
                .filter(l -> l.source().equals(companyId) || l.target().equals(companyId))
                .toList();
        Set<String> nodeIds = new HashSet<>();
        nodeIds.add(companyId);
        for (MonitorConnectionsDTO.ConnectionLinkDTO link : links) {
            nodeIds.add(link.source());
            nodeIds.add(link.target());
        }
        List<MonitorConnectionsDTO.ConnectionNodeDTO> nodes = full.nodes().stream()
                .filter(n -> nodeIds.contains(n.id()))
                .toList();
        return new MonitorConnectionsDTO(nodes, links);
    }
}
