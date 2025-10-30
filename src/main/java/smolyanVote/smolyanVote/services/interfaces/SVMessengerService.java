package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVConversationDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVMessageDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;

import java.util.List;

/**
 * Service interface за SVMessenger функционалност
 */
public interface SVMessengerService {
    
    // ========== CONVERSATION MANAGEMENT ==========
    
    /**
     * Вземи всички активни разговори на потребител
     * Сортирани по последно съобщение (най-новите първи)
     * 
     * @param currentUser Текущият user
     * @return List от ConversationDTO
     */
    List<SVConversationDTO> getAllConversations(UserEntity currentUser);
    
    /**
     * Вземи конкретен разговор по ID
     * 
     * @param conversationId ID на разговора
     * @param currentUser Текущият user (за валидация)
     * @return ConversationDTO
     * @throws IllegalArgumentException ако user не е participant
     */
    SVConversationDTO getConversation(Long conversationId, UserEntity currentUser);
    
    /**
     * Старт на нов разговор или вземи съществуващ
     * 
     * @param currentUser Текущият user
     * @param otherUserId ID на другия потребител
     * @return ConversationDTO
     * @throws IllegalArgumentException ако otherUserId == currentUser.id
     */
    SVConversationDTO startOrGetConversation(UserEntity currentUser, Long otherUserId);
    
    /**
     * Провери дали съществува разговор между двама users
     */
    boolean conversationExists(Long userId1, Long userId2);
    
    /**
     * Изтрий разговор (soft delete)
     * 
     * @param conversationId ID на разговора
     * @param currentUser Текущият user (за валидация)
     */
    void deleteConversation(Long conversationId, UserEntity currentUser);
    
    /**
     * Скрий разговор от панела (не изтрива историята)
     * 
     * @param conversationId ID на разговора
     * @param currentUser Текущият user (за валидация)
     */
    void hideConversation(Long conversationId, UserEntity currentUser);
    
    // ========== MESSAGE MANAGEMENT ==========
    
    /**
     * Изпрати ново съобщение
     * 
     * @param conversationId ID на разговора
     * @param text Текст на съобщението
     * @param sender Изпращач
     * @return MessageDTO на новото съобщение
     * @throws IllegalArgumentException ако sender не е participant
     */
    SVMessageDTO sendMessage(Long conversationId, String text, UserEntity sender);
    
    /**
     * Вземи история на съобщения с pagination
     * 
     * @param conversationId ID на разговора
     * @param page Номер на страницата (0-based)
     * @param size Размер на страницата
     * @param currentUser Текущият user (за валидация)
     * @return Page от MessageDTO
     */
    Page<SVMessageDTO> getMessages(Long conversationId, int page, int size, UserEntity currentUser);
    
    /**
     * Маркирай едно съобщение като прочетено
     * 
     * @param messageId ID на съобщението
     * @param reader Четящият user
     */
    void markMessageAsRead(Long messageId, UserEntity reader);
    
    /**
     * Маркирай всички съобщения в разговор като прочетени
     * 
     * @param conversationId ID на разговора
     * @param reader Четящият user
     */
    void markAllAsRead(Long conversationId, UserEntity reader);
    
    /**
     * Изтрий съобщение (soft delete)
     * 
     * @param messageId ID на съобщението
     * @param currentUser Текущият user (само sender може да изтрие)
     */
    void deleteMessage(Long messageId, UserEntity currentUser);
    
    /**
     * Редактирай съобщение
     * 
     * @param messageId ID на съобщението
     * @param newText Нов текст
     * @param currentUser Текущият user (само sender може да редактира)
     * @return Обновеното MessageDTO
     */
    SVMessageDTO editMessage(Long messageId, String newText, UserEntity currentUser);
    
    // ========== STATISTICS & COUNTS ==========
    
    /**
     * Общ брой непрочетени съобщения за user (от всички разговори)
     * 
     * @param user Потребителят
     * @return Брой непрочетени
     */
    Long getTotalUnreadCount(UserEntity user);
    
    /**
     * Брой непрочетени съобщения в конкретен разговор
     * 
     * @param conversationId ID на разговора
     * @param user Потребителят
     * @return Брой непрочетени
     */
    Integer getUnreadCount(Long conversationId, UserEntity user);
    
    /**
     * Общ брой съобщения в разговор
     */
    Long getMessageCount(Long conversationId);
    
    /**
     * Брой активни разговори за user
     */
    Long getConversationCount(UserEntity user);
    
    // ========== TYPING STATUS ==========
    
    /**
     * Update typing status за user в conversation
     * 
     * @param conversationId ID на разговора
     * @param user Потребителят
     * @param isTyping Дали пише (true) или спря (false)
     */
    void updateTypingStatus(Long conversationId, UserEntity user, boolean isTyping);
    
    /**
     * Провери дали някой пише в разговор
     * 
     * @param conversationId ID на разговора
     * @param userId ID на потребителя
     * @return true ако пише
     */
    boolean isUserTyping(Long conversationId, Long userId);
    
    // ========== USER SEARCH ==========
    
    /**
     * Търси потребители по username или име
     * За стартиране на нови разговори
     * 
     * @param query Търсене текст
     * @param currentUser Текущият user (за изключване от резултатите)
     * @return List от UserMinimalDTO
     */
    List<SVUserMinimalDTO> searchUsers(String query, UserEntity currentUser);
    
    /**
     * Търси в следвани потребители по username/име
     * 
     * @param query Търсената дума (може да е null за всички)
     * @param currentUser Текущият user
     * @return List от UserMinimalDTO (само следвани)
     */
    List<SVUserMinimalDTO> searchFollowingUsers(String query, UserEntity currentUser);

    @Transactional
    void markMessageAsDelivered(Long messageId);

    @Transactional
    void markAllUndeliveredAsDeliveredForUser(UserEntity user);
}
