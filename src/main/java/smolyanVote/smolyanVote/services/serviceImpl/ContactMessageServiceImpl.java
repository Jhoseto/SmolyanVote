package smolyanVote.smolyanVote.services.serviceImpl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.ContactMessageEntity;
import smolyanVote.smolyanVote.repositories.ContactMessageRepository;
import smolyanVote.smolyanVote.services.interfaces.ContactMessageService;
import smolyanVote.smolyanVote.viewsAndDTO.ContactFormView;

import java.time.Instant;

@Service
public class ContactMessageServiceImpl implements ContactMessageService {

    private static final Logger logger = LoggerFactory.getLogger(ContactMessageServiceImpl.class);
    private final ContactMessageRepository contactMessageRepository;

    @Autowired
    public ContactMessageServiceImpl(ContactMessageRepository contactMessageRepository) {
        this.contactMessageRepository = contactMessageRepository;
    }


    @Override
    public void saveContactMessage(ContactFormView contactFormView) {
        try {
            ContactMessageEntity message = new ContactMessageEntity();

            message.setName(contactFormView.getName());
            message.setEmail(contactFormView.getEmail());
            message.setSubject(contactFormView.getSubject());
            message.setMessage(contactFormView.getMessage());
            message.setSubmittedAt(Instant.now());
            message.setMarkAsRead(0);


            contactMessageRepository.save(message);
            logger.info("Contact message saved from: {}", contactFormView.getEmail());
        } catch (Exception e) {
            logger.error("Error saving contact message: {}", e.getMessage());
            throw new RuntimeException("Failed to save contact message", e);
        }
    }
}