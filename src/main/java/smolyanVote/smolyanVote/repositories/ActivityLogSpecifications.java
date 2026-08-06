package smolyanVote.smolyanVote.repositories;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import smolyanVote.smolyanVote.models.ActivityLogEntity;
import smolyanVote.smolyanVote.services.support.ActivityLogSearchCriteria;

import java.util.ArrayList;
import java.util.List;

public final class ActivityLogSpecifications {

    private ActivityLogSpecifications() {}

    public static Specification<ActivityLogEntity> fromCriteria(ActivityLogSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.since() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), criteria.since()));
            }

            if (criteria.ipOnly()) {
                predicates.add(cb.isNotNull(root.get("ipAddress")));
                predicates.add(cb.notEqual(cb.lower(root.get("ipAddress")), "unknown"));
                predicates.add(cb.notEqual(root.get("ipAddress"), ""));
            }

            if (hasText(criteria.action())) {
                predicates.add(cb.equal(root.get("action"), criteria.action().trim()));
            }

            if (hasText(criteria.entityType())) {
                predicates.add(cb.equal(root.get("entityType"), criteria.entityType().trim()));
            }

            if (hasText(criteria.username())) {
                String pattern = "%" + criteria.username().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("username")), pattern));
            }

            if (hasText(criteria.typeCategory())) {
                predicates.add(categoryPredicate(root, cb, criteria.typeCategory().trim().toLowerCase()));
            }

            if (hasText(criteria.query())) {
                predicates.add(queryPredicate(root, cb, criteria.query().trim()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate queryPredicate(
            jakarta.persistence.criteria.Root<ActivityLogEntity> root,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            String rawQuery) {
        String q = rawQuery.toLowerCase();
        String pattern = "%" + q + "%";
        List<Predicate> parts = new ArrayList<>();
        parts.add(cb.like(cb.lower(cb.coalesce(root.get("username"), "")), pattern));
        parts.add(cb.like(cb.lower(cb.coalesce(root.get("action"), "")), pattern));
        parts.add(cb.like(cb.lower(cb.coalesce(root.get("entityType"), "")), pattern));
        parts.add(cb.like(cb.lower(cb.coalesce(root.get("details"), "")), pattern));
        parts.add(cb.like(cb.lower(cb.coalesce(root.get("ipAddress"), "")), pattern));

        try {
            long id = Long.parseLong(rawQuery);
            parts.add(cb.equal(root.get("entityId"), id));
        } catch (NumberFormatException ignored) {
            // not an entity id search
        }

        return cb.or(parts.toArray(new Predicate[0]));
    }

    private static Predicate categoryPredicate(
            jakarta.persistence.criteria.Root<ActivityLogEntity> root,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            String category) {
        var action = cb.lower(root.get("action"));
        return switch (category) {
            case "create" -> cb.like(action, "%create%");
            case "interact" -> cb.or(
                    cb.like(action, "%like%"),
                    cb.like(action, "%vote%"),
                    cb.like(action, "%share%"),
                    cb.like(action, "%bookmark%"),
                    cb.like(action, "%follow%"),
                    cb.like(action, "%comment%"));
            case "view" -> cb.like(action, "%view%");
            case "moderate" -> cb.or(
                    cb.like(action, "%delete%"),
                    cb.like(action, "%report%"),
                    cb.like(action, "%moderate%"),
                    cb.like(action, "%admin%"),
                    cb.like(action, "%edit_%"));
            case "auth" -> cb.or(
                    cb.like(action, "%login%"),
                    cb.like(action, "%logout%"),
                    cb.like(action, "%register%"),
                    cb.like(action, "%password%"));
            default -> cb.conjunction();
        };
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
