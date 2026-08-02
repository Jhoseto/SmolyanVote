package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorFlowPathDetailDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorFlowsDTO;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Builds money-flow graph DTOs from scoped contracts (authority → contractor → subcontractor). */
public final class MonitorFlowsGraphBuilder {

    static final int MAX_NODES = 40;
    static final int MAX_AUTH_LINKS = 60;
    static final int MAX_SUB_LINKS = 40;
    static final int TOP_SUB_PREVIEW = 3;

    private MonitorFlowsGraphBuilder() {
    }

    public static MonitorFlowsDTO build(List<MonitorContractEntity> contracts, ObjectMapper mapper) {
        Map<String, BigDecimal> authorityTotals = new HashMap<>();
        Map<String, String> authorityLabels = new HashMap<>();
        Map<String, BigDecimal> contractorTotals = new HashMap<>();
        Map<String, String> contractorLabels = new HashMap<>();
        Map<String, BigDecimal> subcontractorTotals = new HashMap<>();
        Map<String, String> subcontractorLabels = new HashMap<>();
        Map<String, Long> linkCounts = new HashMap<>();
        Map<String, BigDecimal> linkValues = new HashMap<>();
        Map<String, List<MonitorContractEntity>> linkContracts = new HashMap<>();
        Map<String, Long> subLinkCounts = new HashMap<>();
        Map<String, BigDecimal> subLinkValues = new HashMap<>();
        Map<String, String> subLinkNames = new HashMap<>();
        int declaredSubContracts = 0;
        int withSubAmount = 0;

        for (MonitorContractEntity c : contracts) {
            if (c.getAmountEur() == null) {
                continue;
            }
            if (MonitorSubcontractorHelper.hasDeclaredSubcontractor(c)) {
                declaredSubContracts++;
            }
            if (MonitorSubcontractorHelper.effectiveSubcontractingAmountEur(c) != null) {
                withSubAmount++;
            }
            String authId = "auth:" + c.getAuthorityEik();
            authorityLabels.putIfAbsent(authId,
                    c.getAuthorityName() != null ? c.getAuthorityName() : c.getAuthorityEik());
            authorityTotals.merge(authId, c.getAmountEur(), BigDecimal::add);

            String contractorId = c.getContractorEik() != null ? "co:" + c.getContractorEik() : "co:unknown";
            contractorLabels.putIfAbsent(contractorId,
                    c.getContractorName() != null ? c.getContractorName() : "Неизвестен");
            contractorTotals.merge(contractorId, c.getAmountEur(), BigDecimal::add);

            String linkKey = authId + "->" + contractorId;
            linkCounts.merge(linkKey, 1L, Long::sum);
            linkValues.merge(linkKey, c.getAmountEur(), BigDecimal::add);
            linkContracts.computeIfAbsent(linkKey, k -> new ArrayList<>()).add(c);

            if (MonitorSubcontractorHelper.hasDeclaredSubcontractor(c)
                    && c.getContractorEik() != null) {
                BigDecimal subAmount = MonitorSubcontractorHelper.effectiveSubcontractingAmountEur(c);
                if (subAmount == null || subAmount.signum() <= 0) {
                    continue;
                }
                String subEik = c.getSubcontractorEik();
                String subId = subEik != null && !subEik.isBlank()
                        ? "sub:" + subEik.trim()
                        : "sub:unknown";
                subcontractorLabels.putIfAbsent(subId,
                        c.getSubcontractorName() != null ? c.getSubcontractorName() : "Подизпълнител");
                subcontractorTotals.merge(subId, subAmount, BigDecimal::add);

                String subLinkKey = contractorId + "->" + subId;
                subLinkCounts.merge(subLinkKey, 1L, Long::sum);
                subLinkValues.merge(subLinkKey, subAmount, BigDecimal::add);
                if (c.getSubcontractorName() != null && !c.getSubcontractorName().isBlank()) {
                    subLinkNames.putIfAbsent(subLinkKey, c.getSubcontractorName().trim());
                }
            }
        }

        List<MonitorFlowsDTO.FlowLinkDTO> allLinks = linkValues.entrySet().stream()
                .map(e -> toAuthLink(e.getKey(), e.getValue(), linkCounts, linkContracts, authorityTotals, mapper))
                .sorted(Comparator.comparing(MonitorFlowsDTO.FlowLinkDTO::valueEur).reversed())
                .toList();

        List<MonitorFlowsDTO.FlowLinkDTO> trimmedLinks = allLinks.stream()
                .limit(MAX_AUTH_LINKS)
                .toList();

        Set<String> keptNodeIds = new HashSet<>();
        for (MonitorFlowsDTO.FlowLinkDTO link : trimmedLinks) {
            keptNodeIds.add(link.source());
            keptNodeIds.add(link.target());
        }

        List<MonitorFlowsDTO.FlowSubLinkDTO> allSubLinks = subLinkValues.entrySet().stream()
                .map(e -> {
                    String[] parts = e.getKey().split("->");
                    String coId = parts[0];
                    String subId = parts[1];
                    String subEik = subId.startsWith("sub:") ? subId.substring(4) : null;
                    return new MonitorFlowsDTO.FlowSubLinkDTO(
                            coId,
                            subId,
                            e.getValue(),
                            subLinkCounts.getOrDefault(e.getKey(), 0L),
                            subLinkNames.getOrDefault(e.getKey(), subcontractorLabels.get(subId)),
                            "unknown".equals(subEik) ? null : subEik);
                })
                .filter(sl -> keptNodeIds.contains(sl.source()))
                .sorted(Comparator.comparing(MonitorFlowsDTO.FlowSubLinkDTO::valueEur).reversed())
                .limit(MAX_SUB_LINKS)
                .toList();

        for (MonitorFlowsDTO.FlowSubLinkDTO subLink : allSubLinks) {
            keptNodeIds.add(subLink.target());
        }

        Set<String> primaryIds = new HashSet<>(keptNodeIds);
        primaryIds.removeIf(id -> id.startsWith("sub:"));

        List<MonitorFlowsDTO.FlowNodeDTO> primaryNodes = primaryIds.stream()
                .map(id -> {
                    BigDecimal total = nodeTotal(id, authorityTotals, contractorTotals, subcontractorTotals);
                    String label = nodeLabel(id, authorityLabels, contractorLabels, subcontractorLabels);
                    String type = nodeType(id);
                    return new MonitorFlowsDTO.FlowNodeDTO(id, label, type, total);
                })
                .sorted(Comparator.comparing(MonitorFlowsDTO.FlowNodeDTO::totalEur).reversed())
                .limit(MAX_NODES)
                .toList();

        Set<String> finalNodeIds = primaryNodes.stream()
                .map(MonitorFlowsDTO.FlowNodeDTO::id)
                .collect(Collectors.toCollection(HashSet::new));

        for (MonitorFlowsDTO.FlowSubLinkDTO subLink : allSubLinks) {
            if (finalNodeIds.contains(subLink.source())) {
                finalNodeIds.add(subLink.target());
            }
        }

        List<MonitorFlowsDTO.FlowNodeDTO> subNodes = finalNodeIds.stream()
                .filter(id -> id.startsWith("sub:"))
                .map(id -> {
                    BigDecimal total = nodeTotal(id, authorityTotals, contractorTotals, subcontractorTotals);
                    String label = nodeLabel(id, authorityLabels, contractorLabels, subcontractorLabels);
                    return new MonitorFlowsDTO.FlowNodeDTO(id, label, "subcontractor", total);
                })
                .toList();

        List<MonitorFlowsDTO.FlowNodeDTO> nodes = new ArrayList<>(primaryNodes);
        nodes.addAll(subNodes);
        List<MonitorFlowsDTO.FlowLinkDTO> links = trimmedLinks.stream()
                .filter(l -> finalNodeIds.contains(l.source()) && finalNodeIds.contains(l.target()))
                .toList();
        List<MonitorFlowsDTO.FlowSubLinkDTO> subLinks = allSubLinks.stream()
                .filter(sl -> finalNodeIds.contains(sl.source()) && finalNodeIds.contains(sl.target()))
                .toList();

        return new MonitorFlowsDTO(
                nodes,
                links,
                subLinks,
                new MonitorFlowsDTO.SubcontractorCoverageDTO(declaredSubContracts, withSubAmount));
    }

    public static MonitorFlowPathDetailDTO buildPathDetail(
            List<MonitorContractEntity> contracts,
            String source,
            String target,
            ObjectMapper mapper) {
        String authEik = source.startsWith("auth:") ? source.substring(5) : null;
        String coEik = target.startsWith("co:") ? target.substring(3) : null;
        if (authEik == null || coEik == null) {
            throw new MonitorNotFoundException("Невалидна връзка за паричен поток.");
        }

        List<MonitorContractEntity> matched = contracts.stream()
                .filter(c -> c.getAmountEur() != null)
                .filter(c -> authEik.equals(c.getAuthorityEik()))
                .filter(c -> coEik.equals(c.getContractorEik())
                        || ("unknown".equals(coEik) && (c.getContractorEik() == null || c.getContractorEik().isBlank())))
                .sorted(Comparator.comparing(MonitorContractEntity::getAmountEur, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        if (matched.isEmpty()) {
            throw new MonitorNotFoundException("Няма договори за избрания паричен поток.");
        }

        MonitorContractEntity first = matched.get(0);
        String authName = first.getAuthorityName() != null ? first.getAuthorityName() : authEik;
        String coName = first.getContractorName() != null ? first.getContractorName() : coEik;

        BigDecimal totalEur = BigDecimal.ZERO;
        BigDecimal subTotal = BigDecimal.ZERO;
        int withSub = 0;
        List<MonitorFlowPathDetailDTO.FlowContractSliceDTO> slices = new ArrayList<>();

        for (MonitorContractEntity c : matched) {
            totalEur = totalEur.add(c.getAmountEur());
            if (MonitorSubcontractorHelper.hasDeclaredSubcontractor(c)) {
                withSub++;
                if (c.getSubcontractingAmountEur() != null) {
                    subTotal = subTotal.add(c.getSubcontractingAmountEur());
                } else {
                    BigDecimal effective = MonitorSubcontractorHelper.effectiveSubcontractingAmountEur(c);
                    if (effective != null) {
                        subTotal = subTotal.add(effective);
                    }
                }
            }
            MonitorFlowHintBuilder.FlowHint hint = MonitorFlowHintBuilder.forContracts(List.of(c), mapper);
            slices.add(new MonitorFlowPathDetailDTO.FlowContractSliceDTO(
                    c.getId(),
                    c.getSubject(),
                    c.getSignedAt(),
                    c.getAmountEur(),
                    c.getSubcontractorName(),
                    c.getSubcontractorEik(),
                    c.getSubcontractingAmountEur(),
                    c.getSubcontractingPercent(),
                    hint.concernLabel(),
                    hint.citizenHint()));
        }

        return new MonitorFlowPathDetailDTO(
                new MonitorFlowPathDetailDTO.FlowPartyDTO(authEik, authName, source),
                new MonitorFlowPathDetailDTO.FlowPartyDTO(
                        "unknown".equals(coEik) ? null : coEik, coName, target),
                new MonitorFlowPathDetailDTO.FlowPathTotalsDTO(
                        totalEur, matched.size(), subTotal.signum() > 0 ? subTotal : null, withSub),
                slices);
    }

    private static MonitorFlowsDTO.FlowLinkDTO toAuthLink(
            String linkKey,
            BigDecimal valueEur,
            Map<String, Long> linkCounts,
            Map<String, List<MonitorContractEntity>> linkContracts,
            Map<String, BigDecimal> authorityTotals,
            ObjectMapper mapper) {
        String[] parts = linkKey.split("->");
        String authId = parts[0];
        List<MonitorContractEntity> grouped = linkContracts.getOrDefault(linkKey, List.of());
        MonitorFlowHintBuilder.FlowHint hint = MonitorFlowHintBuilder.forLinkContracts(
                grouped, valueEur, authorityTotals.get(authId), mapper);
        MonitorSubcontractorHelper.LinkSubcontractSummary sub =
                MonitorSubcontractorHelper.summarizeLink(grouped);
        List<MonitorFlowsDTO.FlowSubPreviewDTO> topSubs = topSubcontractors(grouped);
        return new MonitorFlowsDTO.FlowLinkDTO(
                parts[0],
                parts[1],
                valueEur,
                linkCounts.getOrDefault(linkKey, 0L),
                hint.flaggedCount(),
                hint.concernLabel(),
                hint.citizenHint(),
                sub.contractsWithSubcontractor(),
                sub.subcontractorName(),
                sub.subcontractorEik(),
                sub.subcontractingTotalEur(),
                topSubs);
    }

    private static List<MonitorFlowsDTO.FlowSubPreviewDTO> topSubcontractors(List<MonitorContractEntity> contracts) {
        Map<String, BigDecimal> byEik = new LinkedHashMap<>();
        Map<String, String> names = new HashMap<>();
        Map<String, Integer> counts = new HashMap<>();
        for (MonitorContractEntity c : contracts) {
            if (!MonitorSubcontractorHelper.hasDeclaredSubcontractor(c)) {
                continue;
            }
            String eik = c.getSubcontractorEik();
            if (eik == null || eik.isBlank()) {
                continue;
            }
            String key = eik.trim();
            counts.merge(key, 1, Integer::sum);
            if (c.getSubcontractorName() != null && !c.getSubcontractorName().isBlank()) {
                names.putIfAbsent(key, c.getSubcontractorName().trim());
            }
            if (c.getSubcontractingAmountEur() != null) {
                byEik.merge(key, c.getSubcontractingAmountEur(), BigDecimal::add);
            } else {
                BigDecimal effective = MonitorSubcontractorHelper.effectiveSubcontractingAmountEur(c);
                if (effective != null) {
                    byEik.merge(key, effective, BigDecimal::add);
                }
            }
        }
        return byEik.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(TOP_SUB_PREVIEW)
                .map(e -> new MonitorFlowsDTO.FlowSubPreviewDTO(
                        e.getKey(),
                        names.getOrDefault(e.getKey(), e.getKey()),
                        e.getValue(),
                        counts.getOrDefault(e.getKey(), 0)))
                .toList();
    }

    private static BigDecimal nodeTotal(
            String id,
            Map<String, BigDecimal> authorityTotals,
            Map<String, BigDecimal> contractorTotals,
            Map<String, BigDecimal> subcontractorTotals) {
        if (id.startsWith("auth:")) {
            return authorityTotals.getOrDefault(id, BigDecimal.ZERO);
        }
        if (id.startsWith("co:")) {
            return contractorTotals.getOrDefault(id, BigDecimal.ZERO);
        }
        return subcontractorTotals.getOrDefault(id, BigDecimal.ZERO);
    }

    private static String nodeLabel(
            String id,
            Map<String, String> authorityLabels,
            Map<String, String> contractorLabels,
            Map<String, String> subcontractorLabels) {
        if (id.startsWith("auth:")) {
            return authorityLabels.getOrDefault(id, id);
        }
        if (id.startsWith("co:")) {
            return contractorLabels.getOrDefault(id, id);
        }
        return subcontractorLabels.getOrDefault(id, id);
    }

    private static String nodeType(String id) {
        if (id.startsWith("auth:")) {
            return "authority";
        }
        if (id.startsWith("co:")) {
            return "contractor";
        }
        return "subcontractor";
    }
}
