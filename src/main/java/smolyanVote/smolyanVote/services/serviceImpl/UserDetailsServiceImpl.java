package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.CustomUserDetails;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Autowired
    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Потребителят не беше намерен"));

        if (!user.isActive()) {
            throw new DisabledException("Вашият акаунт не е активиран. Проверете имейла си за потвърждение.");
        }

        user.setOnlineStatus(1);
        userRepository.save(user);

        return new CustomUserDetails(user.getEmail(), user.getPassword(), user);
    }





}
