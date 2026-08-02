package smolyanVote.smolyanVote.services.monitor;

/**
 * Display order for municipal leadership: mayor, ObS chair, deputies, committee chairs, councilors.
 */
public final class MonitorCouncilorRoleOrder {

    private MonitorCouncilorRoleOrder() {
    }

    public static int rank(String roleLabel) {
        if (roleLabel == null || roleLabel.isBlank()) {
            return 50;
        }
        String role = roleLabel.trim().toLowerCase();
        if (role.contains("кмет")) {
            return 0;
        }
        if (role.contains("председател на обс") || role.contains("председател на общинск")) {
            return 1;
        }
        if (role.contains("зам") && role.contains("председател")) {
            return 2;
        }
        if (role.contains("председател на пк") || role.contains("постоянна комисия")) {
            return 3;
        }
        if (role.contains("съветник")) {
            return 4;
        }
        return 5;
    }

    public static int compare(String roleA, String roleB, String nameA, String nameB) {
        int byRole = Integer.compare(rank(roleA), rank(roleB));
        if (byRole != 0) {
            return byRole;
        }
        return nameA.compareToIgnoreCase(nameB);
    }
}
