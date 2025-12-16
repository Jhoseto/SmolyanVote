package smolyanVote.smolyanVote.config.websocket;

import smolyanVote.smolyanVote.models.UserEntity;

import java.security.Principal;

/**
 * Custom Principal implementation за WebSocket routing
 * Гарантира че getName() винаги връща lowercase email (или username като fallback)
 * за правилно WebSocket routing между web и mobile версиите
 */
public class UserPrincipal implements Principal {
    
    private final UserEntity user;
    private final String name;
    
    public UserPrincipal(UserEntity user) {
        this.user = user;
        // Нормализиране на name на lowercase за консистентно WebSocket routing
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            this.name = user.getEmail().toLowerCase();
        } else {
            this.name = user.getUsername().toLowerCase();
        }
    }
    
    @Override
    public String getName() {
        return name;
    }
    
    public UserEntity getUser() {
        return user;
    }
    
    @Override
    public String toString() {
        return "UserPrincipal{name='" + name + "', userId=" + user.getId() + "}";
    }
}

