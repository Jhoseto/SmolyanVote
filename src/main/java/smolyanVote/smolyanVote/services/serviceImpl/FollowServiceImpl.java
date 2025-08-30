package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.UserFollowEntity;
import smolyanVote.smolyanVote.repositories.UserFollowRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.FollowService;

/**
 * Implementation на FollowService
 * Оптимизирано за високи performance заявки
 */
@Service
public class FollowServiceImpl implements FollowService {


    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;

    @Autowired
    public FollowServiceImpl(UserFollowRepository userFollowRepository,
                             UserRepository userRepository) {
        this.userFollowRepository = userFollowRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void followUser(Long followerId, Long followingId) {
        // Validation
        if (followerId == null || followingId == null) {
            throw new IllegalArgumentException("ID-тата не могат да бъдат null");
        }

        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Не можете да следвате себе си");
        }

        if (isFollowing(followerId, followingId)) {
            throw new IllegalArgumentException("Вече следвате този потребител");
        }

        // Fetch users - проверяваме дали съществуват
        UserEntity follower = userRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят който следва не съществува"));
        UserEntity following = userRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят който се следва не съществува"));

        // Create follow relationship
        UserFollowEntity followEntity = new UserFollowEntity(follower, following);
        userFollowRepository.save(followEntity);
    }

    @Override
    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        // Validation
        if (followerId == null || followingId == null) {
            throw new IllegalArgumentException("ID-тата не могат да бъдат null");
        }

        if (!isFollowing(followerId, followingId)) {
            throw new IllegalArgumentException("Не следвате този потребител");
        }

        // Bulk delete - най-бързо
        userFollowRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
    }

    @Override
    public boolean isFollowing(Long followerId, Long followingId) {
        if (followerId == null || followingId == null || followerId.equals(followingId)) {
            return false;
        }
        long count = userFollowRepository.existsByFollowerIdAndFollowingIdRaw(followerId, followingId);
        return count > 0;
    }


    @Override
    public long getFollowersCount(Long userId) {
        if (userId == null) {
            return 0;
        }

        return userFollowRepository.countByFollowingId(userId);
    }

    @Override
    public long getFollowingCount(Long userId) {
        if (userId == null) {
            return 0;
        }

        return userFollowRepository.countByFollowerId(userId);
    }
}