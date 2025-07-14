package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.services.serviceImpl.PublicationLinkValidationServiceImpl;

public interface PublicationLinkValidationService {
    PublicationLinkValidationServiceImpl.ValidationResult validateUrl(String url);

    boolean isBlockedDomain(String domain);

    boolean isUrlAccessible(String url);
}
