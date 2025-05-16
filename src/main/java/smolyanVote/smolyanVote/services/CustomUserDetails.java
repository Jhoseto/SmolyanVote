package smolyanVote.smolyanVote.services;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import smolyanVote.smolyanVote.models.UserEntity;

import java.util.Collection;
import java.util.Collections;

/**
 * Custom implementation of UserDetails interface representing authenticated users.
 */
public class CustomUserDetails implements UserDetails {

    private String username;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;

    private UserEntity userEntity;

    /**
     * Constructs a new CustomUserDetails instance with the specified username, password, and user entity.
     *
     * @param username   the username of the user
     * @param password   the password of the user
     * @param userEntity the UserEntity representing the user
     */
    public CustomUserDetails(String username, String password, UserEntity userEntity) {
        this.username = username;
        this.password = password;
        this.userEntity = userEntity;
        this.authorities = Collections.singleton(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return userEntity.isActive();
    }

    /**
     * Sets the username for this UserDetails object.
     *
     * @param username the new username
     * @return this CustomUserDetails object
     */
    public CustomUserDetails setUsername(String username) {
        this.username = username;
        return this;
    }

    /**
     * Sets the password for this UserDetails object.
     *
     * @param password the new password
     * @return this CustomUserDetails object
     */
    public CustomUserDetails setPassword(String password) {
        this.password = password;
        return this;
    }

    /**
     * Sets the authorities for this UserDetails object.
     *
     * @param authorities the collection of authorities to set
     * @return this CustomUserDetails object
     */
    public CustomUserDetails setAuthorities(Collection<? extends GrantedAuthority> authorities) {
        this.authorities = authorities;
        return this;
    }

    /**
     * Gets the UserEntity associated with this UserDetails object.
     *
     * @return the UserEntity
     */
    public UserEntity getUserEntity() {
        return userEntity;
    }

    /**
     * Sets the UserEntity for this UserDetails object.
     *
     * @param userEntity the new UserEntity to set
     * @return this CustomUserDetails object
     */
    public CustomUserDetails setUserEntity(UserEntity userEntity) {
        this.userEntity = userEntity;
        return this;
    }
}
