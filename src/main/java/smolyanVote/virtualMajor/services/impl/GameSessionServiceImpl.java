package smolyanVote.virtualMajor.services.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.virtualMajor.models.GameSessionEntity;
import smolyanVote.virtualMajor.repositories.GameSessionRepository;
import smolyanVote.virtualMajor.services.interfaces.GameSessionService;
import smolyanVote.virtualMajor.services.interfaces.GameStatisticsService;
import smolyanVote.virtualMajor.viewsAndDTO.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of GameSessionService.
 * Handles creation, persistence, and retrieval of game sessions.
 */
@Service
@Transactional
public class GameSessionServiceImpl implements GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final UserRepository userRepository;
    private final GameStatisticsService gameStatisticsService;
    private final ObjectMapper objectMapper;

    public GameSessionServiceImpl(GameSessionRepository gameSessionRepository,
            UserRepository userRepository,
            GameStatisticsService gameStatisticsService,
            ObjectMapper objectMapper) {
        this.gameSessionRepository = gameSessionRepository;
        this.userRepository = userRepository;
        this.gameStatisticsService = gameStatisticsService;
        this.objectMapper = objectMapper;
    }

    @Override
    public GameSessionDTO createNewGame(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Deactivate any existing active session
        gameSessionRepository.findByUserIdAndIsActiveTrue(userId)
                .ifPresent(existingSession -> {
                    existingSession.setIsActive(false);
                    gameSessionRepository.save(existingSession);
                });

        // Create new session with default values (from frontend constants)
        GameSessionEntity session = new GameSessionEntity();
        session.setUser(user);
        session.setSessionName("Кампания " + Instant.now().toEpochMilli());
        session.setCurrentMonth(1);
        session.setCurrentYear(2030);

        // Initial resources (from INITIAL_RESOURCES in frontend)
        session.setBudget(2800000);
        session.setTrust(55);
        session.setInfrastructure(65);
        session.setEco(85);
        session.setPopulation(27500);
        session.setInnovation(35);

        // Initial taxes
        session.setPropertyTax(1.8);
        session.setVehicleTax(2.2);
        session.setWasteTax(1.2);

        // Initial budgets
        session.setCultureBudget(60000);
        session.setSportBudget(40000);

        // Initialize JSON fields as empty arrays/objects
        session.setInvestmentsJson("[]");
        session.setAvailableProjectsJson("[]");
        session.setRegionsStateJson("[]");
        session.setLogsJson("[\"Добре дошли, г-н Кмет. Смолян ви очаква за първия работен ден.\"]");

        session.setConsecutiveNegativeBudget(0);
        session.setIsGameOver(false);
        session.setIsActive(true);

        GameSessionEntity savedSession = gameSessionRepository.save(session);

        GameStateDTO gameState = convertToDTO(savedSession);
        return new GameSessionDTO(savedSession.getId(), gameState, "Нова игра създадена успешно");
    }

    @Override
    public GameSessionDTO saveGame(Long userId, GameStateDTO gameState) {
        GameSessionEntity session = gameSessionRepository.findByUserIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new RuntimeException("No active game session found"));

        updateEntityFromDTO(gameState, session);
        session.setLastPlayed(Instant.now());

        GameSessionEntity savedSession = gameSessionRepository.save(session);

        return new GameSessionDTO(savedSession.getId(), gameState, "Играта е запазена");
    }

    @Override
    public LoadGameResponse loadGame(Long userId) {
        return gameSessionRepository.findByUserIdAndIsActiveTrue(userId)
                .map(session -> {
                    GameStateDTO gameState = convertToDTO(session);
                    return new LoadGameResponse(true, gameState);
                })
                .orElse(new LoadGameResponse(false, null));
    }

    @Override
    public void deleteGame(Long sessionId, Long userId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));

        // Verify ownership
        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("User is not authorized to delete this session");
        }

        gameSessionRepository.delete(session);
    }

    @Override
    public void endGame(Long sessionId, Long userId, Boolean won) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));

        // Verify ownership
        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("User is not authorized to end this session");
        }

        session.setIsGameOver(true);
        session.setIsActive(false);
        gameSessionRepository.save(session);

        // Update statistics
        gameStatisticsService.updateStatisticsOnGameEnd(userId, session, won);
    }

    @Override
    public void updateEntityFromDTO(GameStateDTO gameState, GameSessionEntity session) {
        session.setCurrentMonth(gameState.getMonth());
        session.setCurrentYear(gameState.getYear());

        // Update resources
        if (gameState.getResources() != null) {
            CityResourcesDTO res = gameState.getResources();
            session.setBudget(res.getBudget());
            session.setTrust(res.getTrust());
            session.setInfrastructure(res.getInfrastructure());
            session.setEco(res.getEco());
            session.setPopulation(res.getPopulation());
            session.setInnovation(res.getInnovation());
        }

        // Update taxes
        if (gameState.getTaxes() != null) {
            session.setPropertyTax(gameState.getTaxes().getProperty());
            session.setVehicleTax(gameState.getTaxes().getVehicle());
            session.setWasteTax(gameState.getTaxes().getWaste());
        }

        // Update budgets
        if (gameState.getBudgets() != null) {
            session.setCultureBudget(gameState.getBudgets().getCulture());
            session.setSportBudget(gameState.getBudgets().getSport());
        }

        // Update JSON fields
        try {
            session.setInvestmentsJson(objectMapper.writeValueAsString(gameState.getInvestments()));
            session.setAvailableProjectsJson(objectMapper.writeValueAsString(gameState.getAvailableProjects()));
            session.setRegionsStateJson(objectMapper.writeValueAsString(gameState.getRegions()));
            session.setLogsJson(objectMapper.writeValueAsString(gameState.getLogs()));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize game data", e);
        }

        session.setConsecutiveNegativeBudget(gameState.getConsecutiveNegativeBudget());
        session.setIsGameOver(gameState.getIsGameOver());
        session.setGameOverReason(gameState.getGameOverReason());
    }

    @Override
    public GameStateDTO convertToDTO(GameSessionEntity session) {
        GameStateDTO dto = new GameStateDTO();
        dto.setMonth(session.getCurrentMonth());
        dto.setYear(session.getCurrentYear());

        // Resources
        CityResourcesDTO resources = new CityResourcesDTO(
                session.getBudget(),
                session.getTrust(),
                session.getInfrastructure(),
                session.getEco(),
                session.getPopulation(),
                session.getInnovation());
        dto.setResources(resources);

        // Taxes
        GameStateDTO.TaxesDTO taxes = new GameStateDTO.TaxesDTO(
                session.getPropertyTax(),
                session.getVehicleTax(),
                session.getWasteTax());
        dto.setTaxes(taxes);

        // Budgets
        GameStateDTO.BudgetsDTO budgets = new GameStateDTO.BudgetsDTO(
                session.getCultureBudget(),
                session.getSportBudget());
        dto.setBudgets(budgets);

        // Deserialize JSON fields
        try {
            dto.setInvestments(objectMapper.readValue(
                    session.getInvestmentsJson(),
                    new TypeReference<List<InvestmentDTO>>() {
                    }));
            dto.setAvailableProjects(objectMapper.readValue(
                    session.getAvailableProjectsJson(),
                    new TypeReference<List<InvestmentDTO>>() {
                    }));
            dto.setRegions(objectMapper.readValue(
                    session.getRegionsStateJson(),
                    new TypeReference<List<RegionDTO>>() {
                    }));
            dto.setLogs(objectMapper.readValue(
                    session.getLogsJson(),
                    new TypeReference<List<String>>() {
                    }));
        } catch (JsonProcessingException e) {
            // If JSON parsing fails, initialize with empty lists
            dto.setInvestments(new ArrayList<>());
            dto.setAvailableProjects(new ArrayList<>());
            dto.setRegions(new ArrayList<>());
            dto.setLogs(new ArrayList<>());
        }

        dto.setConsecutiveNegativeBudget(session.getConsecutiveNegativeBudget());
        dto.setIsGameOver(session.getIsGameOver());
        dto.setGameOverReason(session.getGameOverReason());

        // History is not stored in entity (recalculated if needed)
        dto.setHistory(new ArrayList<>());

        return dto;
    }
}
