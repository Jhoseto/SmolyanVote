package smolyanVote.smolyanVote.services.interfaces;

import java.util.Map;

public interface AdminOverviewService {

    Map<String, Object> getOverview();

    Map<String, Object> getHealthAlerts();
}
