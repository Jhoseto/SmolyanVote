package smolyanVote.virtualMajor.services.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.virtualMajor.models.GameEventHistoryEntity;
import smolyanVote.virtualMajor.models.enums.GameEventType;
import smolyanVote.virtualMajor.repositories.GameEventHistoryRepository;
import smolyanVote.virtualMajor.repositories.GameSessionRepository;
import smolyanVote.virtualMajor.services.interfaces.GeminiAIService;
import smolyanVote.virtualMajor.services.interfaces.VirtualMajorGameService;
import smolyanVote.virtualMajor.viewsAndDTO.AIResponseDTO;
import smolyanVote.virtualMajor.viewsAndDTO.GameStateDTO;

/**
 * Implementation of Virtual Major Game Service.
 * Handles core game logic and turn processing.
 */
@Service
@Transactional
public class VirtualMajorGameServiceImpl implements VirtualMajorGameService {

    private final GameSessionRepository gameSessionRepository;
    private final GameEventHistoryRepository gameEventHistoryRepository;
    private final GeminiAIService geminiAIService;

    public VirtualMajorGameServiceImpl(GameSessionRepository gameSessionRepository,
            GameEventHistoryRepository gameEventHistoryRepository,
            GeminiAIService geminiAIService) {
        this.gameSessionRepository = gameSessionRepository;
        this.gameEventHistoryRepository = gameEventHistoryRepository;
        this.geminiAIService = geminiAIService;
    }

    @Override
    public AIResponseDTO processTurn(Long userId, GameStateDTO gameState) {
        // Calculate resource changes
        calculateResourceChanges(gameState);

        // Check game over conditions
        boolean isGameOver = checkGameOverConditions(gameState);
        gameState.setIsGameOver(isGameOver);

        // Generate AI events for this turn
        AIResponseDTO aiResponse = geminiAIService.generateGameEvents(gameState);

        return aiResponse;
    }

    @Override
    public void calculateResourceChanges(GameStateDTO gameState) {
        // This logic mirrors the frontend premium simulation engine
        // Found in App.tsx lines 594-625

        Integer month = gameState.getMonth();
        boolean isWinter = month == 1 || month == 2 || month == 12;

        // Population changes
        int popChange = -35; // Base churn
        popChange += (gameState.getResources().getTrust() - 50) * 4;
        popChange += (gameState.getResources().getInnovation() - 35) * 6;
        popChange += (gameState.getResources().getInfrastructure() - 60) * 3;

        // Heavy taxation leads to exodus
        double totalTax = gameState.getTaxes().getProperty() +
                gameState.getTaxes().getVehicle() +
                gameState.getTaxes().getWaste();
        if (totalTax > 8) {
            popChange -= (int) ((totalTax - 8) * 45);
        }

        if (isWinter && gameState.getResources().getInfrastructure() < 40) {
            popChange -= 20;
        }

        int newPopulation = Math.max(5000, gameState.getResources().getPopulation() + popChange);
        gameState.getResources().setPopulation(newPopulation);

        // Financial simulation
        int totalMaintenance = 120000; // Base maintenance

        if (isWinter) {
            totalMaintenance += 85000; // Winter surcharge
        }

        // Infrastructure decay overhead
        totalMaintenance += (100 - gameState.getResources().getInfrastructure()) * 1400;

        // Revenue calculation
        double taxEfficiency = totalTax / 5.2;
        int baseRevenue = (int) ((gameState.getResources().getPopulation() * 68 * taxEfficiency) +
                (gameState.getResources().getInnovation() * 2800));

        int newBudget = gameState.getResources().getBudget() + baseRevenue - totalMaintenance;
        gameState.getResources().setBudget(newBudget);

        // Track consecutive negative budget
        if (newBudget < 0) {
            gameState.setConsecutiveNegativeBudget(gameState.getConsecutiveNegativeBudget() + 1);
        } else {
            gameState.setConsecutiveNegativeBudget(0);
        }
    }

    @Override
    public boolean checkGameOverConditions(GameStateDTO gameState) {
        // Game over conditions from frontend (App.tsx line 654)
        return gameState.getResources().getBudget() < -3000000 ||
                gameState.getResources().getTrust() < 5 ||
                gameState.getResources().getPopulation() < 15000;
    }

    @Override
    public void logEvent(Long sessionId, Integer month, Integer year, GameEventType eventType,
            String title, String description, String impactJson) {
        var session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        GameEventHistoryEntity event = new GameEventHistoryEntity();
        event.setSession(session);
        event.setMonthOccurred(month);
        event.setYearOccurred(year);
        event.setEventType(eventType);
        event.setEventTitle(title);
        event.setEventDescription(description);
        event.setImpactJson(impactJson);

        gameEventHistoryRepository.save(event);
    }
}
