package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.viewsAndDTO.UserFollowDto;

/**
 * Mapper за UserFollow операции
 */
@Component
public class UserFollowMapper {

    @Autowired
    private FollowService followService;

    /**
     * Създава success response за follow операция
     */
    public UserFollowDto createFollowResponse(UserEntity currentUser, Long targetUserId, String action) {
        UserFollowDto dto = UserFollowDto.success(
                action.equals("followed") ? "Успешно последвахте потребителя" : "Спряхте да следвате потребителя",
                action
        );

        dto.setFollowersCount(followService.getFollowersCount(targetUserId));
        dto.setFollowingCount(followService.getFollowingCount(currentUser.getId()));
        dto.setUserId(targetUserId);

        return dto;
    }

    /**
     * Създава status response
     */
    public UserFollowDto createStatusResponse(UserEntity currentUser, Long targetUserId) {
        boolean isFollowing = false;
        if (currentUser != null) {
            isFollowing = followService.isFollowing(currentUser.getId(), targetUserId);
        }

        UserFollowDto dto = UserFollowDto.status(
                isFollowing,
                currentUser != null,
                followService.getFollowersCount(targetUserId),
                followService.getFollowingCount(targetUserId)
        );

        dto.setUserId(targetUserId);
        return dto;
    }

    /**
     * Създава stats response
     */
    public UserFollowDto createStatsResponse(Long userId) {
        UserFollowDto dto = new UserFollowDto();
        dto.setSuccess(true);
        dto.setUserId(userId);
        dto.setFollowersCount(followService.getFollowersCount(userId));
        dto.setFollowingCount(followService.getFollowingCount(userId));
        return dto;
    }
}