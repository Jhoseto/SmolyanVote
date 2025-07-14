package smolyanVote.smolyanVote.services.interfaces;


public interface PublicationLinkValidationService {


    boolean isUrlValid(String url);

    String getValidationError(String url);

    boolean isBlockedDomain(String domain);

    boolean isUrlAccessible(String url);
}
