package smolyanVote.virtualMajor.services.interfaces;

import smolyanVote.virtualMajor.viewsAndDTO.StrategicAnalysisDTO;

/**
 * Service for generating deep strategic analysis using AI.
 * Analyzes full game history and resource trends.
 */
public interface StrategicAnalysisAIService {

    /**
     * Generates a comprehensive strategic analysis for the current session.
     * 
     * @param userEmail the email of the user
     * @return StrategicAnalysisDTO containing narrative and trend data
     */
    StrategicAnalysisDTO generateAnalysis(String userEmail);
}
