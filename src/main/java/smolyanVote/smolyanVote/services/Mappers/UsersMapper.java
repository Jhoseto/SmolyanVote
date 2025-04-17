package smolyanVote.smolyanVote.services.Mappers;

import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.viewsAndDTO.UserProfileViewModel;

/**
 * MapperForUsers is a service class responsible for mapping UserEntity to UserProfileViewModel.
 * This mapper converts a UserEntity object into its corresponding UserProfileViewModel representation.
 */
@Service
public class UsersMapper {


    public UserProfileViewModel mapUserToProfileViewModel(UserEntity user) {
        UserProfileViewModel userProfileViewModel = new UserProfileViewModel();

        // Mapping data from UserEntity to UserProfileViewModel
        userProfileViewModel.setId(user.getId());
        userProfileViewModel.setUserName(user.getUsername());
        userProfileViewModel.setEmail(user.getEmail());
        userProfileViewModel.setRealName(user.getRealName());
        userProfileViewModel.setLastOnline(user.getLastOnline());
        userProfileViewModel.setProfileImageUrl(user.getImageUrl());
        userProfileViewModel.setOnlineStatus(user.getOnlineStatus());
        userProfileViewModel.setCreated(user.getCreated());
        userProfileViewModel.setUserOfferCount(user.getUserEventsCount());
        userProfileViewModel.setRole(user.getRole());
        return userProfileViewModel;
    }
}
